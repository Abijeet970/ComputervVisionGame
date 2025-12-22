import React, { useRef, useEffect } from 'react';

const DrawingCanvas = ({ handDataRef, exportRef }) => {
    const canvasRef = useRef(null);
    const prevPoint = useRef(null);
    const isDrawingRef = useRef(false);
    const smoothedPos = useRef(null); // {x, y}

    // Helper: Linear Interpolation
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    // Helper: Detect if a finger is open (Extended)
    // Checks if the Tip is further from Wrist than the PIP (Knuckle area)
    const isFingerOpen = (landmarks, tipIdx, pipIdx) => {
        const wrist = landmarks[0];
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx];

        const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);

        return distTip > distPip;
    };

    // Clear canvas function
    useEffect(() => {
        if (exportRef) {
            exportRef.current = {
                clear: () => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    prevPoint.current = null;
                },
                getBlob: async () => {
                    const canvas = canvasRef.current;
                    if (!canvas) return null;
                    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                }
            };
            // Init white background
            if (canvasRef.current) exportRef.current.clear();
        }
    }, [exportRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const render = () => {
            if (!handDataRef.current || !handDataRef.current.multiHandLandmarks || handDataRef.current.multiHandLandmarks.length === 0) {
                prevPoint.current = null;
                smoothedPos.current = null;
                isDrawingRef.current = false;
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            const landmarks = handDataRef.current.multiHandLandmarks[0];
            const indexTip = landmarks[8];

            // Logic: 
            // - Fist (Index Curled) = Move Cursor (Hover)
            // - Index Open = Draw

            // index finger tips: 8 (TIP), 6 (PIP)
            const indexOpen = isFingerOpen(landmarks, 8, 6);

            // We can also check adjacent fingers to ensure "Pointing" vs "Open Hand", 
            // but the user specific request was "index finger open to draw".
            // So we'll strictly follow that. 
            // If Index is open -> Draw.
            // If Index is closed (Fist) -> Hover.

            isDrawingRef.current = indexOpen;

            // Calculate Target Position (Index Tip)
            const width = canvas.width;
            const height = canvas.height;
            const targetX = (1 - indexTip.x) * width; // Mirror
            const targetY = indexTip.y * height;

            // Smoothing
            const SMOOTHING_FACTOR = 0.5;

            let currentX, currentY;

            if (smoothedPos.current) {
                currentX = lerp(smoothedPos.current.x, targetX, SMOOTHING_FACTOR);
                currentY = lerp(smoothedPos.current.y, targetY, SMOOTHING_FACTOR);
            } else {
                currentX = targetX;
                currentY = targetY;
            }
            smoothedPos.current = { x: currentX, y: currentY };

            // Drawing
            if (isDrawingRef.current) {
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000000';
                ctx.lineJoin = 'round';

                if (prevPoint.current) {
                    ctx.beginPath();
                    ctx.moveTo(prevPoint.current.x, prevPoint.current.y);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                }
                prevPoint.current = { x: currentX, y: currentY };
            } else {
                prevPoint.current = null;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="drawing-board"
            style={{ display: 'block', width: '100%', height: '100%' }}
        />
    );
};

export default DrawingCanvas;
