import React, { useRef, useEffect, useState } from 'react';

const DrawingCanvas = ({ handResults, exportRef }) => {
    const canvasRef = useRef(null);
    const [isPinching, setIsPinching] = useState(false);
    const prevPoint = useRef(null);

    // Clear canvas function
    useEffect(() => {
        if (exportRef) {
            exportRef.current = {
                clear: () => {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    prevPoint.current = null;
                },
                getBlob: async () => {
                    const canvas = canvasRef.current;
                    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                }
            };
            // Init white background
            exportRef.current.clear();
        }
    }, [exportRef]);

    useEffect(() => {
        if (!handResults || !handResults.multiHandLandmarks || handResults.multiHandLandmarks.length === 0) {
            prevPoint.current = null;
            return;
        }

        const landmarks = handResults.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        // Calculate distance for pinch
        const distance = Math.hypot(
            indexTip.x - thumbTip.x,
            indexTip.y - thumbTip.y
        );

        // Pinch threshold (experimentally determined, around 0.05-0.1 in relative coords)
        const PINCH_THRESHOLD = 0.05;
        const pinching = distance < PINCH_THRESHOLD;
        setIsPinching(pinching);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Flip x for mirror effect
        const x = (1 - indexTip.x) * width;
        const y = indexTip.y * height;

        if (pinching) {
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';

            if (prevPoint.current) {
                ctx.beginPath();
                ctx.moveTo(prevPoint.current.x, prevPoint.current.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            prevPoint.current = { x, y };
        } else {
            prevPoint.current = null;
        }

        // Draw cursor (always visible)
        // We need to restore context or draw on a separate layer/overlay to not mess up the drawing.
        // For simplicity, we just won't draw cursor on main canvas, or we need a specific 'cursor' overlay.
        // Let's rely on the user seeing their drawing. But a cursor is helpful.
        // Actually, drawing a temporary cursor involves clearing/redrawing which is expensive on same canvas.
        // We'll leave the cursor out for now or assume specific UI overlay in parent.

    }, [handResults]);

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
