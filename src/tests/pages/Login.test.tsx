import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as AuthHook from '../../hooks/useAuth';

// Mock dependencies
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

describe('Login Page', () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
            login: mockLogin
        } as any);
    });

    it('renders login form', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('shows error validation for empty fields', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('calls login on valid submission', async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('displays error from auth failure', async () => {
        const error = { code: 'auth/user-not-found' };
        mockLogin.mockRejectedValue(error);

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass' } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/no account found/i)).toBeInTheDocument();
        });
    });
});
