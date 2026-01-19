/**
 * ImageModal Component
 * 
 * Provides image expansion functionality:
 * - RenderImageWithMagnifier: Displays an image with a magnifying glass overlay
 * - ImageModal: Full-screen modal for viewing expanded images
 */

import { useState, MouseEvent } from 'react';
import './ImageModal.css';

interface RenderImageWithMagnifierProps {
    src: string;
    alt: string;
    className?: string;
    onExpand: (src: string) => void;
}

/**
 * Context-friendly image component with magnifier overlay
 */
export function RenderImageWithMagnifier({ src, alt, className, onExpand }: RenderImageWithMagnifierProps): React.ReactElement {
    return (
        <div className={`image-container ${className || ''}`}>
            <img src={src} alt={alt} />
            <div
                className="magnify-icon"
                onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    onExpand(src);
                }}
                title="Expand Image"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
        </div>
    );
}

interface ImageModalProps {
    src: string | null;
    onClose: () => void;
}

/**
 * Full-screen image modal overlay
 */
export function ImageModal({ src, onClose }: ImageModalProps): React.ReactElement | null {
    if (!src) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <img src={src} alt="Expanded Mascot" className="modal-image" />
            </div>
        </div>
    );
}

interface UseImageExpansionReturn {
    expandedImage: string | null;
    expandImage: (src: string) => void;
    closeImage: () => void;
}

/**
 * Hook to manage image expansion state
 */
export function useImageExpansion(): UseImageExpansionReturn {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const expandImage = (src: string): void => setExpandedImage(src);
    const closeImage = (): void => setExpandedImage(null);

    return {
        expandedImage,
        expandImage,
        closeImage
    };
}
