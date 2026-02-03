import React from 'react';
import type { GenderCode } from '../types/bracket';
import './CreateOtherBracketPrompt.css';

interface CreateOtherBracketPromptProps {
    targetGender: GenderCode; // The gender of the bracket to create
    onCreate: () => void;
    onDismiss?: () => void;
    message?: string;
    className?: string;
}

const CreateOtherBracketPrompt: React.FC<CreateOtherBracketPromptProps> = ({
    targetGender,
    onCreate,
    onDismiss,
    message,
    className = ''
}) => {
    const genderText = targetGender === 'M' ? "Men's" : "Women's";
    const defaultMessage = `First, save and/or publish your current bracket and then you can create a ${genderText} bracket.`;

    return (
        <div className={`cross-gender-promo ${className}`}>
            {onDismiss && (
                <button className="close-btn" onClick={onDismiss} aria-label="Close">×</button>
            )}
            <p>You haven't filled out a {genderText} bracket yet!</p>
            <p>{message || defaultMessage}</p>
            <button
                onClick={onCreate}
                className="create-bracket-btn"
                style={{ marginTop: '10px', width: '100%' }}
            >
                Create {genderText} Bracket
            </button>
        </div>
    );
};

export default CreateOtherBracketPrompt;
