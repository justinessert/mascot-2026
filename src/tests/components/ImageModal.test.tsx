import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RenderImageWithMagnifier, ImageModal } from '../../components/ImageModal';

describe('ImageModal Components', () => {
    describe('RenderImageWithMagnifier', () => {
        const mockExpand = vi.fn();

        it('renders image and magnifier icon', () => {
            render(
                <RenderImageWithMagnifier
                    src="test.jpg"
                    alt="Test Mascot"
                    onExpand={mockExpand}
                />
            );

            expect(screen.getByRole('img')).toHaveAttribute('src', 'test.jpg');
            // Check for SVG icon or title
            expect(screen.getByTitle('Expand Image')).toBeInTheDocument();
        });

        it('calls onExpand when magnifier is clicked', () => {
            render(
                <RenderImageWithMagnifier
                    src="test.jpg"
                    alt="Test Mascot"
                    onExpand={mockExpand}
                />
            );

            fireEvent.click(screen.getByTitle('Expand Image'));
            expect(mockExpand).toHaveBeenCalledWith('test.jpg');
        });
    });

    describe('ImageModal Overlay', () => {
        const mockClose = vi.fn();

        it('renders nothing when src is null', () => {
            const { container } = render(<ImageModal src={null} onClose={mockClose} />);
            expect(container).toBeEmptyDOMElement();
        });

        it('renders modal with image when src is provided', () => {
            render(<ImageModal src="large.jpg" onClose={mockClose} />);

            const img = screen.getByRole('img', { name: /expanded mascot/i });
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'large.jpg');
        });

        it('calls onClose when close button is clicked', () => {
            render(<ImageModal src="large.jpg" onClose={mockClose} />);

            // Find the button wrapping the SVG
            const closeBtn = screen.getByRole('button');
            fireEvent.click(closeBtn);

            expect(mockClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when overlay background is clicked', () => {
            const { container } = render(<ImageModal src="large.jpg" onClose={mockClose} />);

            // Click the outer overlay div
            const overlay = container.firstChild;
            if (overlay) {
                fireEvent.click(overlay);
                expect(mockClose).toHaveBeenCalled();
            }
        });
    });
});
