/**
 * Password Input Component
 * 
 * A password input field with a visibility toggle button.
 * Click the eye icon to show/hide the password.
 */

import { useState, ChangeEvent } from 'react';
import './PasswordInput.css';

// SVG Eye Icons - clean, modern outline style
const EyeOpenIcon = (): React.ReactElement => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = (): React.ReactElement => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
}

function PasswordInput({
    id,
    value,
    onChange,
    placeholder = "Enter password",
    disabled = false,
    label = "Password"
}: PasswordInputProps): React.ReactElement {
    // State to track if password is visible
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Toggle password visibility
    const toggleVisibility = (): void => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div className="password-input-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={toggleVisibility}
                    disabled={disabled}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
            </div>
        </div>
    );
}

export default PasswordInput;
