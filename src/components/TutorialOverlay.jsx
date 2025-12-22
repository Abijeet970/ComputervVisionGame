import React from 'react';

const TutorialOverlay = ({ onClose }) => {
    return (
        <div className="overlay-backdrop">
            <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>How to Play</h2>

                <div className="tutorial-step" style={{ margin: '2rem 0' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem'
                    }}>
                        👆
                    </div>
                    <h3>1. Show Hand</h3>
                    <p style={{ opacity: 0.8 }}>Hold your hand up to the camera.</p>
                </div>

                <div className="tutorial-step" style={{ margin: '2rem 0' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem'
                    }}>
                        👌
                    </div>
                    <h3>2. Pinch to Draw</h3>
                    <p style={{ opacity: 0.8 }}>Bring your <strong>Index</strong> and <strong>Thumb</strong> together to draw lines.</p>
                </div>

                <button onClick={onClose} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                    Got it!
                </button>
            </div>
        </div>
    );
};

export default TutorialOverlay;
