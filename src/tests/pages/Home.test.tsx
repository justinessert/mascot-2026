import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import * as TournamentHook from '../../hooks/useTournament';
import * as AuthHook from '../../hooks/useAuth';
import * as BracketService from '../../services/bracketService';

// Mock dependencies
vi.mock('../../hooks/useTournament');
vi.mock('../../hooks/useAuth');
vi.mock('../../services/bracketService');
vi.mock('../../components/HowItWorks', () => ({
    default: () => <div data-testid="how-it-works">how it works</div>
}));

describe('Home Page', () => {
    beforeEach(() => {
        // Default mocks
        vi.spyOn(TournamentHook, 'useTournament').mockReturnValue({
            selectedYear: 2026,
            selectedGender: 'M'
        } as any);

        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: null
        } as any);

        vi.spyOn(BracketService, 'loadBracket').mockResolvedValue(null);
    });

    it('renders heading and tagline', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Mascot Madness 2026/i)).toBeInTheDocument();
        expect(screen.getByText(/build your bracket/i)).toBeInTheDocument();
    });

    it('shows "Start Picking" when user is guest (no bracket)', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByRole('link', { name: /start picking/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /view leaderboard/i })).toBeInTheDocument();
    });

    it('shows "View Your Bracket" if user has one saved', async () => {
        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            user: { uid: '123' }
        } as any);

        vi.spyOn(BracketService, 'loadBracket').mockResolvedValue({ id: 'bracket123' } as any);

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByRole('link', { name: /view your bracket/i })).toBeInTheDocument();
    });

    it('renders HowItWorks component', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByTestId('how-it-works')).toBeInTheDocument();
    });
});
