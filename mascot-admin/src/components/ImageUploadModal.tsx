import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg, { MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT } from '../utils/canvasUtils';
import type { Area } from 'react-easy-crop';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (blob: Blob) => void;
}

export default function ImageUploadModal({ isOpen, onClose, onSave }: ImageUploadModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);

            // Get original dimensions
            const img = new Image();
            img.src = imageDataUrl;
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
            };
        }
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedImage) {
                    onSave(croppedImage);
                    onClose();
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleReset = () => {
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    if (!isOpen) return null;

    // Check dimensions
    const cropWidth = croppedAreaPixels?.width || 0;
    const cropHeight = croppedAreaPixels?.height || 0;
    const isTooSmall = cropWidth < 600 || cropHeight < 800;

    // Check scaling
    let scalingMessage = '';
    if (cropWidth > MAX_IMAGE_WIDTH || cropHeight > MAX_IMAGE_HEIGHT) {
        // Replicate logic from canvasUtils
        const ratio = Math.min(MAX_IMAGE_WIDTH / cropWidth, MAX_IMAGE_HEIGHT / cropHeight);
        const scaledW = Math.round(cropWidth * ratio);
        const scaledH = Math.round(cropHeight * ratio);
        scalingMessage = ` scaled to ${scaledW} x ${scaledH} px`;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                <div className="modal-header">
                    <h2>Upload & Crop Team Photo</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {!imageSrc ? (
                        <div className="upload-placeholder">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload" className="primary-button">
                                📂 Select Image
                            </label>
                            <p className="helper-text">Recommended: High resolution, landscape or portrait</p>
                        </div>
                    ) : (
                        <div className="crop-workspace">
                            <div className="crop-container" style={{ position: 'relative', height: 400, width: '100%', background: '#333' }}>
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={3 / 4}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onMediaLoaded={() => {
                                        // Fit image within container by default
                                    }}
                                />
                            </div>

                            <div className="controls-panel" style={{ marginTop: '20px' }}>
                                <div className="control-group">
                                    <label>Zoom</label>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="zoom-range"
                                    />
                                </div>

                                <div className="info-panel" style={{ display: 'flex', gap: '20px', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div className="info-item">
                                        <span className="label">Original:</span>
                                        <span className="value">{imageDimensions.width} x {imageDimensions.height} px</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Crop:</span>
                                        <span className="value" style={{ color: isTooSmall ? '#ff6b6b' : 'var(--accent-color)' }}>
                                            {cropWidth} x {cropHeight} px
                                            {scalingMessage && <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}> ({scalingMessage})</span>}
                                        </span>
                                    </div>
                                </div>

                                {isTooSmall && (
                                    <div className="warning-box" style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', borderRadius: '4px', color: '#ff6b6b', fontSize: '0.9rem' }}>
                                        ⚠️ Warning: Create image might be too small. Minimum recommended: 600x800.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button className="secondary-button" onClick={onClose}>Cancel</button>
                    {imageSrc && (
                        <>
                            <button className="secondary-button" onClick={handleReset}>Select New</button>
                            <button className="primary-button" onClick={handleSave}>Submit Image</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
