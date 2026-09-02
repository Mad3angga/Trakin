import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * ImageCropModal
 * Ultra-clean, minimalist iOS-style photo cropper:
 * - Header: "Choose Photo" (centered)
 * - Viewport: Clean crop frame with thin white outline and dimmed exterior
 * - Gestures: Smooth touch drag, pinch-to-zoom, mouse drag & wheel zoom with boundary clamping
 * - Footer: "Cancel" on bottom-left, "Choose" on bottom-right
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} imageSrc - Base64 or ObjectURL of the image to crop
 * @param {function} onClose - Callback when user cancels
 * @param {function} onCropComplete - Callback (croppedFile, previewUrl) => void
 * @param {number} aspectRatio - Width / Height ratio (default: 1 for square profile)
 * @param {string} title - Header title (default: "Choose Photo")
 * @param {string} outputFileName - Exported file name (default: "profile_cropped.jpg")
 */
export default function ImageCropModal({
    isOpen,
    imageSrc,
    onClose,
    onCropComplete,
    aspectRatio = 1,
    title = 'Choose Photo',
    outputFileName = 'profile_cropped.jpg',
}) {
    if (!isOpen || !imageSrc) return null;

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPinchDist, setInitialPinchDist] = useState(null);
    const [initialZoomOnPinch, setInitialZoomOnPinch] = useState(1);
    const [imageMeta, setImageMeta] = useState({ naturalWidth: 0, naturalHeight: 0 });
    const [cropBoxSize, setCropBoxSize] = useState({ width: 320, height: 320 });

    const containerRef = useRef(null);
    const cropFrameRef = useRef(null);
    const imgRef = useRef(null);

    // Update crop box size dynamically based on container width
    useEffect(() => {
        const updateDimensions = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const targetWidth = Math.min(containerWidth, 360);
            const targetHeight = aspectRatio >= 1 ? targetWidth / aspectRatio : targetWidth / aspectRatio;
            setCropBoxSize({
                width: Math.round(targetWidth),
                height: Math.round(targetHeight),
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio, isOpen]);

    // Base scale so image fills the crop box completely at zoom = 1 (Cover mode)
    const baseScale = useMemo(() => {
        if (!imageMeta.naturalWidth || !imageMeta.naturalHeight || !cropBoxSize.width) return 1;
        const scaleX = cropBoxSize.width / imageMeta.naturalWidth;
        const scaleY = cropBoxSize.height / imageMeta.naturalHeight;
        return Math.max(scaleX, scaleY);
    }, [imageMeta, cropBoxSize]);

    const baseWidth = useMemo(() => {
        return imageMeta.naturalWidth * baseScale;
    }, [imageMeta.naturalWidth, baseScale]);

    const baseHeight = useMemo(() => {
        return imageMeta.naturalHeight * baseScale;
    }, [imageMeta.naturalHeight, baseScale]);

    // Helper to strictly clamp pan offset so image bounds NEVER leave the crop box
    const clampPan = useCallback((targetX, targetY, currentZoom) => {
        const currentScaledWidth = baseWidth * currentZoom;
        const currentScaledHeight = baseHeight * currentZoom;

        const maxPanX = Math.max(0, (currentScaledWidth - cropBoxSize.width) / 2);
        const maxPanY = Math.max(0, (currentScaledHeight - cropBoxSize.height) / 2);

        return {
            x: Math.min(Math.max(targetX, -maxPanX), maxPanX),
            y: Math.min(Math.max(targetY, -maxPanY), maxPanY),
        };
    }, [baseWidth, baseHeight, cropBoxSize]);

    // Reset crop states when a new image is loaded
    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [imageSrc, isOpen]);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setImageMeta({ naturalWidth, naturalHeight });
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Update zoom and re-clamp pan immediately
    const handleZoomChange = (newZoom) => {
        const clampedZoom = Math.min(Math.max(newZoom, 1), 3.5);
        const roundedZoom = Number(clampedZoom.toFixed(3));
        setZoom(roundedZoom);
        setPan((prevPan) => clampPan(prevPan.x, prevPan.y, roundedZoom));
    };

    // --- Drag Handlers (Mouse & Touch) ---
    const handleStartDrag = (clientX, clientY) => {
        setIsDragging(true);
        setDragStart({
            x: clientX - pan.x,
            y: clientY - pan.y,
        });
    };

    const handleMoveDrag = (clientX, clientY) => {
        if (!isDragging) return;
        const targetX = clientX - dragStart.x;
        const targetY = clientY - dragStart.y;
        setPan(clampPan(targetX, targetY, zoom));
    };

    const handleEndDrag = () => {
        setIsDragging(false);
    };

    // --- Touch Gestures (Pinch to Zoom + Drag) ---
    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            const dist = getTouchDistance(e.touches);
            setInitialPinchDist(dist);
            setInitialZoomOnPinch(zoom);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 1) {
            handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && initialPinchDist) {
            const currentDist = getTouchDistance(e.touches);
            const scaleFactor = currentDist / initialPinchDist;
            handleZoomChange(initialZoomOnPinch * scaleFactor);
        }
    };

    const handleTouchEnd = (e) => {
        if (e.touches.length === 0) {
            handleEndDrag();
            setInitialPinchDist(null);
        } else if (e.touches.length === 1) {
            setInitialPinchDist(null);
            handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    // --- Mouse Wheel Zoom ---
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoomChange(zoom + delta);
    };

    // --- Generate Cropped Canvas ---
    const handleApplyCrop = useCallback(() => {
        if (!imgRef.current || !imageMeta.naturalWidth || !imageMeta.naturalHeight || !cropBoxSize.width) return;

        const img = imgRef.current;
        const outputWidth = aspectRatio >= 1 ? 800 : Math.round(800 * aspectRatio);
        const outputHeight = aspectRatio >= 1 ? Math.round(800 / aspectRatio) : 800;

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Scale factor from rendered crop space to natural image space
        const currentScaledWidth = baseWidth * zoom;
        const scaleToNatural = imageMeta.naturalWidth / currentScaledWidth;

        // Crop box dimensions in natural image coordinates
        const cropBoxInNaturalWidth = cropBoxSize.width * scaleToNatural;
        const cropBoxInNaturalHeight = cropBoxSize.height * scaleToNatural;

        // Top-left coordinate of the crop box relative to natural image origin
        const currentScaledHeight = baseHeight * zoom;
        const cropBoxInNaturalX = ((currentScaledWidth - cropBoxSize.width) / 2 - pan.x) * scaleToNatural;
        const cropBoxInNaturalY = ((currentScaledHeight - cropBoxSize.height) / 2 - pan.y) * scaleToNatural;

        // Safely clamp coordinate boundaries to prevent out-of-bounds sampling
        const safeSx = Math.max(0, Math.min(cropBoxInNaturalX, imageMeta.naturalWidth - cropBoxInNaturalWidth));
        const safeSy = Math.max(0, Math.min(cropBoxInNaturalY, imageMeta.naturalHeight - cropBoxInNaturalHeight));
        const safeSw = Math.min(cropBoxInNaturalWidth, imageMeta.naturalWidth - safeSx);
        const safeSh = Math.min(cropBoxInNaturalHeight, imageMeta.naturalHeight - safeSy);

        // Draw cropped sub-rectangle directly to output canvas
        ctx.drawImage(
            img,
            safeSx,
            safeSy,
            safeSw,
            safeSh,
            0,
            0,
            outputWidth,
            outputHeight
        );

        // Convert canvas to Blob & File
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const croppedFile = new File([blob], outputFileName, { type: 'image/jpeg' });
                const previewUrl = URL.createObjectURL(blob);
                onCropComplete(croppedFile, previewUrl);
                onClose();
            },
            'image/jpeg',
            0.92
        );
    }, [aspectRatio, baseWidth, baseHeight, zoom, pan, cropBoxSize, imageMeta, outputFileName, onCropComplete, onClose]);

    const renderedImgWidth = baseWidth ? baseWidth * zoom : 'auto';
    const renderedImgHeight = baseHeight ? baseHeight * zoom : 'auto';

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center select-none animate-in fade-in duration-200">
            {/* Modal Sheet Container */}
            <div className="bg-[#121212] w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[92vh] rounded-t-[32px] sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white">
                
                {/* Top Center Title */}
                <div className="pt-5 pb-3 text-center shrink-0">
                    <h3 className="font-semibold text-base text-white tracking-wide">
                        {title}
                    </h3>
                </div>

                {/* Cropping Viewport Container */}
                <div
                    ref={containerRef}
                    onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
                    onMouseUp={handleEndDrag}
                    onMouseLeave={handleEndDrag}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none px-0"
                >
                    {/* Image Layer */}
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop Subject"
                        onLoad={handleImageLoad}
                        draggable={false}
                        style={{
                            width: typeof renderedImgWidth === 'number' ? `${renderedImgWidth}px` : 'auto',
                            height: typeof renderedImgHeight === 'number' ? `${renderedImgHeight}px` : 'auto',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            transform: `translate(${pan.x}px, ${pan.y}px)`,
                            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                        }}
                        className="pointer-events-none select-none shrink-0"
                    />

                    {/* Outer Dimmed Mask Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Crop Frame Box with crisp thin white outline */}
                        <div
                            ref={cropFrameRef}
                            style={{
                                width: `${cropBoxSize.width}px`,
                                height: `${cropBoxSize.height}px`,
                            }}
                            className="relative shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none"
                        >
                            {/* Thin Crisp White Outline matching screenshot */}
                            <div className="absolute inset-0 border border-white/80 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Bottom Footer Bar: Cancel (left) & Choose (right) */}
                <div className="px-6 py-5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] bg-[#121212] flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/90 hover:text-white text-base font-normal active:opacity-60 transition-opacity cursor-pointer px-2 py-1"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleApplyCrop}
                        className="text-white font-semibold text-base hover:text-white active:opacity-60 transition-opacity cursor-pointer px-2 py-1"
                    >
                        Choose
                    </button>
                </div>

            </div>
        </div>
    );
}
