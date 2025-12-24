import React, { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import DrawingCanvas from './components/DrawingCanvas';
import TutorialOverlay from './components/TutorialOverlay';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ MISSING API KEY! Please check your .env file and restart the server.");
} else {
  console.log("✅ API Key loaded successfully.");
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function App() {
  const [guesses, setGuesses] = useState([]);
  const [targetWord, setTargetWord] = useState("Apple"); // Example start word
  const [gameStatus, setGameStatus] = useState("idle"); // idle, playing, won
  const [timeLeft, setTimeLeft] = useState(20);
  const [showTutorial, setShowTutorial] = useState(true);

  // Use Ref for high-frequency hand data to avoid React re-renders logic
  const handDataRef = useRef(null);
  const canvasExportRef = useRef(null);
  const timerRef = useRef(null);

  const onHandData = (results) => {
    handDataRef.current = results;
  };

  const startGame = () => {
    setGameStatus("playing");
    setGuesses([]);
    setTimeLeft(20);
    // TODO: Random word generator
    const words = ["Apple", "House", "Car", "Tree", "Smile", "Sun", "Mug", "Fish", "Boat"];
    setTargetWord(words[Math.floor(Math.random() * words.length)]);

    if (canvasExportRef.current) canvasExportRef.current.clear();
  };

  // Timer
  useEffect(() => {
    if (gameStatus === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameStatus("lost");
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStatus]);

  // AI Guessing Loop
  useEffect(() => {
    let interval;
    if (gameStatus === "playing") {
      interval = setInterval(async () => {
        if (!canvasExportRef.current) return;

        try {
          const blob = await canvasExportRef.current.getBlob();
          if (!blob) {
            console.log("Canvas empty or blob failed");
            return;
          }

          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];

            try {
              const result = await model.generateContent([
                `Look at this sketch. Describe what you see instantly. If it's just random lines, say "Line" or "Scribble". If it's a shape, say "Circle" or "Square". If it looks like an object, guess the object. Return ONLY a comma-separated list of 3 short guesses. e.g. "Line, Curve, House".`,
                {
                  inlineData: {
                    data: base64data,
                    mimeType: "image/jpeg",
                  },
                },
              ]);

              const text = result.response.text();
              console.log("Gemini guesses:", text);
              setGuesses(text.split(',').map(s => s.trim()));

              // Check win condition
              if (text.toLowerCase().includes(targetWord.toLowerCase())) {
                setGameStatus("won");
                clearInterval(timerRef.current);
              }
            } catch (innerErr) {
              console.error("Gemini API Error:", innerErr);
              setGuesses(["API Error..."]);
            }
          };
        } catch (err) {
          console.error("Canvas/General Error:", err);
        }
      }, 1500); // Back to 1.5s to be safe on quota
    }
    return () => clearInterval(interval);
  }, [gameStatus, targetWord]);

  return (
    <div className="app-container">
      {/* Background Bubbles */}
      <div className="bubble" style={{ left: '10%', width: '40px', height: '40px', animationDelay: '0s' }}></div>
      <div className="bubble" style={{ left: '30%', width: '60px', height: '60px', animationDelay: '2s' }}></div>
      <div className="bubble" style={{ left: '70%', width: '30px', height: '30px', animationDelay: '4s' }}></div>
      <div className="bubble" style={{ left: '80%', width: '50px', height: '50px', animationDelay: '1s' }}></div>

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      <CameraFeed onHandData={onHandData} />

      {/* Game Header - Only visible when playing */}
      {gameStatus === "playing" && (
        <div className="game-header">
          <div className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', gap: '2rem', padding: '1rem 2rem' }}>
            <div className="target-word">
              <span style={{ opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Draw this</span>
              <h2 style={{ fontSize: '2rem', color: 'var(--primary)', lineHeight: 1 }}>{targetWord}</h2>
            </div>

            <div className="timer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{timeLeft}s</span>
            </div>

            <div className="ai-vision" style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
              <span style={{ opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI sees</span>
              <div style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {guesses[0] ? guesses[0] : <span style={{ opacity: 0.5 }}>Drawing...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu / Results Overlay */}
      {gameStatus !== "playing" && (
        <div className="overlay-backdrop">
          <div className="glass-panel modal-content">
            {gameStatus === "idle" && (
              <div className="modal-inner">
                <h1 className="title-gradient">Ocean Canvas</h1>
                <p className="subtitle">An AI-powered drawing experiment</p>

                <div className="instruction-grid">
                  <div className="instruction-item">
                    <span className="icon">☝️</span>
                    <p><strong>Point</strong> to Draw</p>
                  </div>
                  <div className="instruction-item">
                    <span className="icon">✊</span>
                    <p><strong>Fist</strong> to Move</p>
                  </div>
                </div>

                <div className="button-group">
                  <button onClick={startGame} className="btn-primary">Start Game</button>
                  <button onClick={() => setShowTutorial(true)} className="btn-secondary">How to Play</button>
                </div>
              </div>
            )}

            {gameStatus === "won" && (
              <div className="modal-inner">
                <div className="result-icon">🎉</div>
                <h2 className="text-gradient">Masterpiece!</h2>
                <p>The AI correctly identified your <strong>{targetWord}</strong>.</p>
                <div className="button-group">
                  <button onClick={startGame} className="btn-primary">Play Again</button>
                </div>
              </div>
            )}

            {gameStatus === "lost" && (
              <div className="modal-inner">
                <div className="result-icon">⌛</div>
                <h2>Time's Up</h2>
                <p>The AI couldn't quite see a <strong>{targetWord}</strong>.</p>
                <p className="hint">Try drawing bigger or clearer lines!</p>
                <div className="button-group">
                  <button onClick={startGame} className="btn-primary">Try Again</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="canvas-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', position: 'relative', zIndex: 5 }}>
        <div className="canvas-container">
          <DrawingCanvas handDataRef={handDataRef} exportRef={canvasExportRef} />
        </div>
      </div>

      <CursorOverlay handDataRef={handDataRef} />
    </div>
  );
}

// Separate component for High-Performance Cursor
const CursorOverlay = ({ handDataRef }) => {
  const cursorRef = useRef(null);

  useEffect(() => {
    let animId;
    const update = () => {
      if (handDataRef.current && handDataRef.current.multiHandLandmarks && handDataRef.current.multiHandLandmarks[0]) {
        const landmarks = handDataRef.current.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const x = (1 - indexTip.x) * 100; // Mirror
        const y = indexTip.y * 100;

        if (cursorRef.current) {
          cursorRef.current.style.display = 'block';
          cursorRef.current.style.left = `${x}%`;
          cursorRef.current.style.top = `${y}%`;
        }
      } else {
        if (cursorRef.current) cursorRef.current.style.display = 'none';
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="debug-cursor" style={{
      position: 'absolute',
      opacity: 0.8,
      pointerEvents: 'none',
      zIndex: 150,
      top: 0, left: 0, width: '100%', height: '100%'
    }}>
      <div ref={cursorRef} style={{
        position: 'fixed',
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: 'var(--primary)',
        border: '3px solid white',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 15px var(--primary)',
        display: 'none',
        transition: 'left 0.1s linear, top 0.1s linear' // Add CSS smoothing
      }} />
    </div>
  );
};

export default App;
