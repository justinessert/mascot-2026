import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../../pages/Signup';
import * as AuthHook from '../../hooks/useAuth';

// Hoist mockNavigate
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../../hooks/useAuth');
vi.mock('../../components/PasswordInput', () => ({
    default: ({ id, value, onChange, placeholder, label }: any) => (
        <div>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type="password"
            />
        </div>
    )
}));

describe('Signup Page', () => {
    const mockSignup = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            signup: mockSignup
        } as any);
    });

    it('shows validation error for password mismatch', () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        // Fill all fields but mismatch passwords
        fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password999' } });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        expect(mockSignup).not.toHaveBeenCalled();
    });

    it('calls signup on valid submission', async () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', 'User');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
