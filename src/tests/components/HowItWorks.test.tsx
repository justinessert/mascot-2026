import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HowItWorks from '../../components/HowItWorks';

describe('HowItWorks Component', () => {
    it('renders the main heading', () => {
        render(<HowItWorks />);
        expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
    });

    it('renders all 4 steps', () => {
        render(<HowItWorks />);

        // Check for step numbers
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();

        // Check for step titles
        expect(screen.getByText('Pick Your Winners')).toBeInTheDocument();
        expect(screen.getByText('Complete Your Bracket')).toBeInTheDocument();
        expect(screen.getByText('Save & Publish')).toBeInTheDocument();
        expect(screen.getByText('Watch & Compete')).toBeInTheDocument();
    });
});
