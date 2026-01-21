import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordInput from '../../components/PasswordInput';

describe('PasswordInput Component', () => {
    it('renders with label and placeholder', () => {
        render(
            <PasswordInput
                id="test-pwd"
                value=""
                onChange={() => { }}
                label="Secret Code"
                placeholder="Enter secrets"
            />
        );
        expect(screen.getByLabelText('Secret Code')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter secrets')).toBeInTheDocument();
    });

    it('toggles password visibility when eye icon is clicked', () => {
        render(
            <PasswordInput
                id="test-pwd"
                value="myPassword123"
                onChange={() => { }}
            />
        );

        const input = screen.getByLabelText('Password') as HTMLInputElement;
        const toggleBtn = screen.getByRole('button', { name: /show password/i });

        // Initially hidden
        expect(input.type).toBe('password');

        // Click to show
        fireEvent.click(toggleBtn);
        expect(input.type).toBe('text');
        expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

        // Click to hide again
        fireEvent.click(toggleBtn);
        expect(input.type).toBe('password');
    });

    it('calls onChange handler when typing', () => {
        const handleChange = vi.fn();
        render(
            <PasswordInput
                id="test-pwd"
                value=""
                onChange={handleChange}
            />
        );

        const input = screen.getByLabelText('Password');
        fireEvent.change(input, { target: { value: 'a' } });

        expect(handleChange).toHaveBeenCalledTimes(1);
    });
});
