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

    it('renders two teams correctly', () => {
        render(<Matchup topTeam={mockTeamA} bottomTeam={mockTeamB} />);

        expect(screen.getByText('Formatted teama')).toBeInTheDocument();
        expect(screen.getByText('Formatted teamb')).toBeInTheDocument();
    });

    it('renders placeholders when teams are null', () => {
        render(<Matchup topTeam={null} bottomTeam={null} />);

        const placeholders = screen.getAllByText('—');
        expect(placeholders).toHaveLength(2);
    });

    it('renders mixed state (one team and one placeholder)', () => {
        render(<Matchup topTeam={mockTeamA} bottomTeam={null} />);

        expect(screen.getByText('Formatted teama')).toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
