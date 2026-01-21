import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import * as AuthHook from '../../hooks/useAuth';
import * as TournamentHook from '../../hooks/useTournament';
import * as BlockerHook from '../../hooks/useNavigationBlocker';

// Mock the hooks
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useTournament');
vi.mock('../../hooks/useNavigationBlocker');

describe('Layout Component', () => {
    // Default mock return values
    const mockLogout = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup default hook implementations
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: null,
            loading: false,
            signIn: vi.fn(),
            logout: mockLogout,
            register: vi.fn(),
        } as any);

        vi.spyOn(TournamentHook, 'useTournament').mockReturnValue({
            selectedYear: 2025,
            setSelectedYear: vi.fn(),
            selectedGender: 'M',
            setSelectedGender: vi.fn(),
            availableYears: [2025, 2024],
            getDisplayLabel: () => '2025 Men',
            tournamentData: null,
            loading: false,
            error: null
        } as any);

        vi.spyOn(BlockerHook, 'useNavigationBlocker').mockReturnValue({
            safeNavigate: mockNavigate,
            showWarning: false,
            confirmLeave: vi.fn(),
            cancelLeave: vi.fn(),
            isDirty: false,
            setIsDirty: vi.fn()
        } as any);
    });

    it('renders navigation links for anonymous user', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        expect(screen.getByText(/Mascot Madness/i)).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        // Should not see logout
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('renders user profile and logout when authenticated', () => {
        // Mock authenticated user
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: { displayName: 'Test User', email: 'test@example.com' },
            loading: false,
            signIn: vi.fn(),
            logout: mockLogout,
            register: vi.fn()
        } as any);

        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        expect(screen.getByText('👤 Test User')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('toggles mobile menu', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        const menuToggle = screen.getByLabelText('Toggle menu');
        const navMenu = screen.getByRole('navigation');

        // Initially closed (check class or visibility if possible, but class is easiest unit test)
        expect(navMenu).not.toHaveClass('open');

        // Click to open
        fireEvent.click(menuToggle);
        expect(navMenu).toHaveClass('open');

        // Click to close
        fireEvent.click(menuToggle);
        expect(navMenu).not.toHaveClass('open');
    });

    it('navigates when links are clicked', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Home'));
        expect(mockNavigate).toHaveBeenCalledWith('/');

        fireEvent.click(screen.getByText('Info'));
        expect(mockNavigate).toHaveBeenCalledWith('/info');
    });

    it('shows year selector dropdown', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        const toggleBtn = screen.getByLabelText('Select tournament year and gender');

        // Open selector
        fireEvent.click(toggleBtn);

        expect(screen.getByText('Men')).toBeInTheDocument();
        expect(screen.getByText('Women')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Select tournament year' })).toBeInTheDocument();
    });
});
