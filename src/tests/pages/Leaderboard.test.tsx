import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard from '../../pages/Leaderboard';
import * as TournamentHook from '../../hooks/useTournament';
import * as AuthHook from '../../hooks/useAuth';
import * as FirestoreModule from 'firebase/firestore';
import * as LeaderboardService from '../../services/leaderboardService';

// Mock dependencies
vi.mock('../../hooks/useTournament');
vi.mock('../../hooks/useAuth');
vi.mock('../../services/firebase', () => ({
    db: {}
}));
vi.mock('firebase/firestore');
vi.mock('../../services/leaderboardService');
vi.mock('../../components/ComingSoon', () => ({
    default: () => <div data-testid="coming-soon">Coming Soon</div>
}));
vi.mock('../../components/LeaderboardSelector', () => ({
    default: ({ selectedId, onSelect }: any) => (
        <div data-testid="leaderboard-selector">
            <span>{selectedId || 'Global'}</span>
        </div>
    )
}));
vi.mock('../../components/CreateLeaderboardModal', () => ({
    default: () => null
}));
vi.mock('../../components/JoinLeaderboardModal', () => ({
    default: () => null
}));

describe('Leaderboard Page', () => {
    // Hoist the mock function so it's available in vi.mock
    const { mockNavigate } = vi.hoisted(() => ({
        mockNavigate: vi.fn()
    }));
    const mockGetDocs = vi.fn();

    // Setup React Router navigation mock
    vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
            ...actual as any,
            useNavigate: () => mockNavigate
        };
    });

    beforeEach(() => {
        vi.resetAllMocks();

        // Default hooks
        vi.spyOn(TournamentHook, 'useTournament').mockReturnValue({
            selectedYear: 2026,
            selectedGender: 'M',
            getCutoffTime: () => new Date('2026-03-20'), // Future date
            hasBracketData: () => true,
            getSelectionSundayTime: () => new Date()
        } as any);

        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: null
        } as any);

        // Firestore Mocks
        vi.spyOn(FirestoreModule, 'collection').mockReturnValue({} as any);
        vi.spyOn(FirestoreModule, 'getDocs').mockImplementation(mockGetDocs);
        vi.spyOn(FirestoreModule, 'getDoc').mockResolvedValue({ exists: () => false } as any);
        vi.spyOn(FirestoreModule, 'doc').mockReturnValue({} as any);

        // Leaderboard Service Mocks
        vi.spyOn(LeaderboardService, 'getAllCustomLeaderboardMeta').mockResolvedValue([]);
        vi.spyOn(LeaderboardService, 'hasPublishedBracket').mockResolvedValue(false);
        vi.spyOn(LeaderboardService, 'getCustomLeaderboard').mockResolvedValue(null);
    });

    it('shows ComingSoon if no bracket data', () => {
        vi.spyOn(TournamentHook, 'useTournament').mockReturnValue({
            hasBracketData: () => false,
            getSelectionSundayTime: () => new Date()
        } as any);

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        expect(screen.getByTestId('coming-soon')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        mockGetDocs.mockReturnValue(new Promise(() => { })); // Never resolves

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders empty state when no brackets found', async () => {
        mockGetDocs.mockResolvedValue({
            forEach: () => [] // Empty list
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no brackets yet/i)).toBeInTheDocument();
    });

    it('renders brackets sorted by score', async () => {
        const mockData = [
            { id: '1', data: () => ({ bracketName: 'Low Score', userName: 'User B', score: 100 }) },
            { id: '2', data: () => ({ bracketName: 'High Score', userName: 'User A', score: 200 }) }
        ];

        mockGetDocs.mockResolvedValue({
            forEach: (cb: any) => mockData.forEach(cb)
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        // Wait for table
        await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

        const rows = screen.getAllByRole('row');
        // Row 0 is header. Row 1 should be High Score (Rank 1). Row 2 should be Low Score (Rank 2).

        expect(rows[1]).toHaveTextContent('High Score');
        expect(rows[1]).toHaveTextContent('200'); // Score
        expect(rows[1]).toHaveTextContent('1');   // Rank

        expect(rows[2]).toHaveTextContent('Low Score');
        expect(rows[2]).toHaveTextContent('100');
        expect(rows[2]).toHaveTextContent('2');
    });

    it('highlights user own bracket', async () => {
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: { uid: 'my-uid' }
        } as any);

        const mockData = [
            { id: '1', data: () => ({ bracketId: 'my-uid', bracketName: 'My Bracket', score: 150 }) }
        ];

        mockGetDocs.mockResolvedValue({
            forEach: (cb: any) => mockData.forEach(cb)
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Bracket')).toBeInTheDocument());

        // Check header stats
        const elements = screen.getAllByText('My Bracket');
        expect(elements.length).toBeGreaterThan(0);
        const scoreElements = screen.getAllByText('150');
        expect(scoreElements.length).toBeGreaterThan(0);
    });

    it('renders action buttons', async () => {
        mockGetDocs.mockResolvedValue({
            forEach: () => []
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        // Check action buttons are present
        expect(screen.getByText(/Create/i)).toBeInTheDocument();
        expect(screen.queryByText('Join')).not.toBeInTheDocument();
    });

    it('renders leaderboard selector', async () => {
        mockGetDocs.mockResolvedValue({
            forEach: () => []
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        expect(screen.getByTestId('leaderboard-selector')).toBeInTheDocument();
    });
    it('shows create prompt when user has not published or collaborated', async () => {
        // User logged in
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: { uid: 'my-uid' }
        } as any);

        // User has NOT published
        vi.spyOn(LeaderboardService, 'hasPublishedBracket').mockResolvedValue(false);

        // Leaderboard has brackets, but user is NOT in them
        const mockData = [
            {
                id: '1',
                data: () => ({
                    bracketId: 'other-uid',
                    bracketName: 'Other Bracket',
                    score: 100,
                    contributorUids: []
                })
            }
        ];

        mockGetDocs.mockResolvedValue({
            forEach: (cb: any) => mockData.forEach(cb)
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        // Should see the prompt
        // "Create & publish a bracket to get on the leaderboard"
        expect(await screen.findByText(/Create & publish a bracket/i)).toBeInTheDocument();
    });

    it('hides create prompt when user is a contributor', async () => {
        // User logged in
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: { uid: 'contributor-uid' }
        } as any);

        // User has NOT published their own bracket
        vi.spyOn(LeaderboardService, 'hasPublishedBracket').mockResolvedValue(false);

        // User IS a contributor
        const mockData = [
            {
                id: '1',
                data: () => ({
                    bracketId: 'owner-uid',
                    bracketName: 'Shared Bracket',
                    score: 100,
                    contributorUids: ['contributor-uid']
                })
            }
        ];

        mockGetDocs.mockResolvedValue({
            forEach: (cb: any) => mockData.forEach(cb)
        });

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        // Wait for loading to finish
        await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());

        // Should NOT see the prompt
        expect(screen.queryByText(/Create & publish a bracket/i)).not.toBeInTheDocument();
    });
});
