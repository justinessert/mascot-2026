/**
 * Leaderboard Service
 * Handles custom leaderboard operations: create, join, list
 */

import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    documentId,
    DocumentData,
    arrayUnion,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import type { Gender } from '../types/bracket';

/**
 * Hash a password using SHA-256 via Web Crypto API
 * Returns a hex string of the hash
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Metadata for a custom leaderboard (used in selector dropdown)
 */
export interface CustomLeaderboardMeta {
    id: string;
    name: string;
    description: string;
    hasPassword: boolean;
    memberCount: number;
    creatorId: string;
}

/**
 * Full custom leaderboard data including member list
 */
export interface CustomLeaderboard extends CustomLeaderboardMeta {
    memberIds: string[];
    passwordHash?: string; // Store hash, not plain password
}

/**
 * Entry in a leaderboard (same structure as global leaderboard)
 */
export interface LeaderboardEntry {
    id: string;
    bracketId: string;
    bracketName: string;
    userName: string;
    score: number;
    maxScore: number | null;
    champion: DocumentData | null;
    contributors?: string[];
    contributorUids?: string[];
}

/**
 * Get the Firestore path for custom leaderboards collection
 */
function getCustomLeaderboardsPath(gender: Gender, year: number): string {
    return `leaderboard/${gender}/years/${year}/custom_leaderboards`;
}

/**
 * Get the Firestore path for main leaderboard entries
 */
function getEntriesPath(gender: Gender, year: number): string {
    return `leaderboard/${gender}/years/${year}/entries`;
}

/**
 * Fetch all custom leaderboard names/metadata (lightweight)
 * Only fetches metadata, not full entries
 */
export async function getAllCustomLeaderboardMeta(
    year: number,
    gender: Gender = 'men'
): Promise<CustomLeaderboardMeta[]> {
    const collectionRef = collection(db, getCustomLeaderboardsPath(gender, year));
    const snapshot = await getDocs(collectionRef);

    const leaderboards: CustomLeaderboardMeta[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        leaderboards.push({
            id: doc.id,
            name: data.name || 'Unnamed',
            description: data.description || '',
            hasPassword: !!data.passwordHash,
            memberCount: (data.memberIds || []).length,
            creatorId: data.creatorId || '',
        });
    });

    // Sort by name alphabetically
    leaderboards.sort((a, b) => a.name.localeCompare(b.name));

    return leaderboards;
}

/**
 * Fetch a single custom leaderboard by ID (includes memberIds)
 */
export async function getCustomLeaderboard(
    leaderboardId: string,
    year: number,
    gender: Gender = 'men'
): Promise<CustomLeaderboard | null> {
    const docRef = doc(db, getCustomLeaderboardsPath(gender, year), leaderboardId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();
    return {
        id: snapshot.id,
        name: data.name || 'Unnamed',
        description: data.description || '',
        hasPassword: !!data.passwordHash,
        passwordHash: data.passwordHash, // Include hash for validation
        memberCount: (data.memberIds || []).length,
        creatorId: data.creatorId || '',
        memberIds: data.memberIds || [],
    };
}

/**
 * Fetch leaderboard entries for a custom leaderboard
 * Filters global entries by memberIds
 */
export async function getCustomLeaderboardEntries(
    leaderboardId: string,
    year: number,
    gender: Gender = 'men'
): Promise<LeaderboardEntry[]> {
    // First get the custom leaderboard to get member IDs
    const leaderboard = await getCustomLeaderboard(leaderboardId, year, gender);

    if (!leaderboard || leaderboard.memberIds.length === 0) {
        return [];
    }

    // Firestore 'in' queries are limited to 30 items
    // For larger groups, we'd need to batch queries
    const memberIds = leaderboard.memberIds.slice(0, 30);

    const entriesRef = collection(db, getEntriesPath(gender, year));
    const q = query(entriesRef, where(documentId(), 'in', memberIds));
    const snapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
            id: doc.id,
            bracketId: data.bracketId || '',
            bracketName: data.bracketName || 'Unknown',
            userName: data.userName || 'Anonymous',
            score: data.score ?? 0,
            maxScore: data.maxScore ?? null,
            champion: data.champion || null,
            contributors: data.contributors || [],
            contributorUids: data.contributorUids || [],
        });
    });

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    return entries;
}

/**
 * Create a new custom leaderboard
 * Automatically adds creator as first member
 */
export async function createCustomLeaderboard(
    user: User,
    year: number,
    name: string,
    description: string = '',
    password: string = '',
    gender: Gender = 'men'
): Promise<string> {
    if (!user) {
        throw new Error('User not authenticated');
    }

    const trimmedName = name.trim();

    // Check for duplicate name
    const existingLeaderboards = await getAllCustomLeaderboardMeta(year, gender);
    const duplicateName = existingLeaderboards.find(
        lb => lb.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
        throw new Error('A leaderboard with this name already exists');
    }

    // Generate a unique ID (could use addDoc instead, but this gives us control)
    const leaderboardId = `${user.uid}_${Date.now()}`;
    const docRef = doc(db, getCustomLeaderboardsPath(gender, year), leaderboardId);

    const data: DocumentData = {
        name: trimmedName,
        description: description.trim(),
        creatorId: user.uid,
        memberIds: [user.uid], // Creator is automatically a member
        createdAt: new Date(),
    };

    // Only store password hash if provided
    if (password.trim()) {
        data.passwordHash = await hashPassword(password.trim());
    }

    await setDoc(docRef, data);

    return leaderboardId;
}

/**
 * Join a custom leaderboard
 * Validates password if the leaderboard has one
 */
export async function joinCustomLeaderboard(
    user: User,
    leaderboardId: string,
    year: number,
    password: string = '',
    gender: Gender = 'men'
): Promise<{ success: boolean; error?: string }> {
    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    // Fetch leaderboard to validate password and check membership
    const leaderboard = await getCustomLeaderboard(leaderboardId, year, gender);

    if (!leaderboard) {
        return { success: false, error: 'Leaderboard not found' };
    }

    // Check if already a member
    if (leaderboard.memberIds.includes(user.uid)) {
        return { success: false, error: 'Already a member of this leaderboard' };
    }

    // Validate password if required
    if (leaderboard.passwordHash) {
        const inputHash = await hashPassword(password.trim());
        if (leaderboard.passwordHash !== inputHash) {
            return { success: false, error: 'Incorrect password' };
        }
    }

    // Add user to memberIds
    const docRef = doc(db, getCustomLeaderboardsPath(gender, year), leaderboardId);
    await setDoc(docRef, {
        memberIds: arrayUnion(user.uid)
    }, { merge: true });

    return { success: true };
}

/**
 * Check if user has a published bracket for the given year/gender
 */
export async function hasPublishedBracket(
    user: User | null,
    year: number,
    gender: Gender = 'men'
): Promise<boolean> {
    if (!user) return false;

    const entryRef = doc(db, getEntriesPath(gender, year), user.uid);
    const snapshot = await getDoc(entryRef);

    return snapshot.exists();
}

/**
 * Check if user is a member of a specific custom leaderboard
 */
export async function isUserMemberOfLeaderboard(
    user: User | null,
    leaderboardId: string,
    year: number,
    gender: Gender = 'men'
): Promise<boolean> {
    if (!user) return false;

    const leaderboard = await getCustomLeaderboard(leaderboardId, year, gender);
    if (!leaderboard) return false;

    return leaderboard.memberIds.includes(user.uid);
}

/**
 * Get all custom leaderboards a user is a member of
 */
export async function getUserCustomLeaderboards(
    user: User | null,
    year: number,
    gender: Gender = 'men'
): Promise<CustomLeaderboardMeta[]> {
    if (!user) return [];

    const collectionRef = collection(db, getCustomLeaderboardsPath(gender, year));
    // Check if user's UID is in the memberIds array
    const q = query(collectionRef, where('memberIds', 'array-contains', user.uid));

    const snapshot = await getDocs(q);
    const leaderboards: CustomLeaderboardMeta[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        leaderboards.push({
            id: doc.id,
            name: data.name || 'Unnamed',
            description: data.description || '',
            hasPassword: !!data.passwordHash,
            memberCount: (data.memberIds || []).length,
            creatorId: data.creatorId || '',
        });
    });

    return leaderboards;
}
