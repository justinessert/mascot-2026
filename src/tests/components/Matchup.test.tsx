import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Matchup from '../../components/Matchup';

// Mock the constants module
vi.mock('../../constants/nicknames', () => ({
    formatTeamName: (name: string) => `Formatted ${name}`
}));

describe('Matchup Component', () => {
    const mockTeamA = {
        name: 'teama',
        seed: 1,
        image: 'img-a.jpg',
        wins: []
    };
    const mockTeamB = {
        name: 'teamb',
        seed: 16,
        image: 'img-b.jpg',
        wins: []
    };

    describe('Basic rendering', () => {
        it('renders two teams correctly', () => {
            render(<Matchup topTeam={mockTeamA as any} bottomTeam={mockTeamB as any} />);

            expect(screen.getByText('Formatted teama')).toBeInTheDocument();
            expect(screen.getByText('Formatted teamb')).toBeInTheDocument();
        });

        it('renders placeholders when teams are null', () => {
            render(<Matchup topTeam={null} bottomTeam={null} />);

            const placeholders = screen.getAllByText('—');
            expect(placeholders).toHaveLength(2);
        });

        it('renders mixed state (one team and one placeholder)', () => {
            render(<Matchup topTeam={mockTeamA as any} bottomTeam={null} />);

            expect(screen.getByText('Formatted teama')).toBeInTheDocument();
            expect(screen.getByText('—')).toBeInTheDocument();
        });
    });

    describe('Correct answer display', () => {
        it('shows correct icon when user picked the winner correctly', () => {
            render(
                <Matchup
                    topTeam={mockTeamA as any}
                    bottomTeam={mockTeamB as any}
                    correctWinner="teama"
                    correctLoser="teamb"
                    correctTeam1="teama"
                    correctTeam2="teamb"
                    showCorrectAnswers={true}
                />
            );

            expect(screen.getByLabelText('Correct pick')).toBeInTheDocument();
        });

        it('shows loser icon when user picked correctly but team lost', () => {
            render(
                <Matchup
                    topTeam={mockTeamA as any}
                    bottomTeam={mockTeamB as any}
                    correctWinner="teamb"
                    correctLoser="teama"
                    correctTeam1="teama"
                    correctTeam2="teamb"
                    showCorrectAnswers={true}
                />
            );

            expect(screen.getByLabelText('Lost')).toBeInTheDocument();
        });

        it('shows strikethrough with actual team when user picked wrong opponent', () => {
            render(
                <Matchup
                    topTeam={mockTeamA as any}
                    bottomTeam={mockTeamB as any}
                    correctWinner="teamc"
                    correctLoser="teama"
                    correctTeam1="teama"
                    correctTeam2="teamc"  // User had teamb but actual was teamc
                    showCorrectAnswers={true}
                />
            );

            // Should show user's wrong pick with strikethrough
            expect(screen.getByText('Formatted teamb')).toBeInTheDocument();
            expect(screen.getByLabelText('Wrong pick')).toBeInTheDocument();
            // Should show actual team
            expect(screen.getByText('Formatted teamc')).toBeInTheDocument();
        });

        it('does not show indicators when showCorrectAnswers is false', () => {
            render(
                <Matchup
                    topTeam={mockTeamA as any}
                    bottomTeam={mockTeamB as any}
                    correctWinner="teama"
                    correctTeam1="teama"
                    correctTeam2="teamb"
                    showCorrectAnswers={false}
                />
            );

            expect(screen.queryByLabelText('Correct pick')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Wrong pick')).not.toBeInTheDocument();
        });

        it('shows pending state when game not yet played', () => {
            render(
                <Matchup
                    topTeam={mockTeamA as any}
                    bottomTeam={mockTeamB as any}
                    correctWinner=""
                    correctTeam1=""
                    correctTeam2=""
                    showCorrectAnswers={true}
                />
            );

            // Should still show team names but no indicators
            expect(screen.getByText('Formatted teama')).toBeInTheDocument();
            expect(screen.queryByLabelText('Correct pick')).not.toBeInTheDocument();
        });
    });
});
