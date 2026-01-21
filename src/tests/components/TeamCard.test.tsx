import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamCard from '../../components/TeamCard';

// Mock dependencies
vi.mock('../../constants/nicknames', () => ({
    formatMascotName: (name: string) => `Mascot ${name}`,
    formatTeamName: (name: string) => `Team ${name}`
}));

// Mock the image component since it might have complex internal logic
vi.mock('../../components/ImageModal', () => ({
    RenderImageWithMagnifier: ({ src, alt, onExpand }: any) => (
        <button data-testid="mascot-img" onClick={() => onExpand(src)}>
            {alt}
        </button>
    )
}));

describe('TeamCard Component', () => {
    const mockTeam = {
        name: 'cats',
        seed: 1,
        image: 'cats.jpg',
        wins: []
    };

    const mockSelect = vi.fn();
    const mockExpand = vi.fn();

    it('renders team info correctly', () => {
        render(
            <TeamCard
                team={mockTeam as any}
                onSelect={mockSelect}
                onExpandImage={mockExpand}
                isPreviousPick={false}
            />
        );

        expect(screen.getByText('Mascot cats')).toBeInTheDocument();
        expect(screen.getByText('Team cats')).toBeInTheDocument();
        expect(screen.getByTestId('mascot-img')).toBeInTheDocument();
    });

    it('shows star for previous pick', () => {
        render(
            <TeamCard
                team={mockTeam as any}
                onSelect={mockSelect}
                onExpandImage={mockExpand}
                isPreviousPick={true}
            />
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('calls onSelect when card is clicked', () => {
        render(
            <TeamCard
                team={mockTeam as any}
                onSelect={mockSelect}
                onExpandImage={mockExpand}
                isPreviousPick={false}
            />
        );

        // Click the main card container (finding by text to get a child, then clicking parent or just clicking text works if it propagates)
        fireEvent.click(screen.getByText('Team cats'));
        expect(mockSelect).toHaveBeenCalledWith(mockTeam);
    });

    it('calls onExpandImage when image is clicked', () => {
        render(
            <TeamCard
                team={mockTeam as any}
                onSelect={mockSelect}
                onExpandImage={mockExpand}
                isPreviousPick={false}
            />
        );

        fireEvent.click(screen.getByTestId('mascot-img'));
        expect(mockExpand).toHaveBeenCalledWith('cats.jpg');
    });
});
