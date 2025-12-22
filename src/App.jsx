import React, { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import DrawingCanvas from './components/DrawingCanvas';
import TutorialOverlay from './components/TutorialOverlay';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function App() {
  const [handData, setHandData] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [targetWord, setTargetWord] = useState("Apple"); // Example start word
  const [gameStatus, setGameStatus] = useState("idle"); // idle, playing, won
  const [timeLeft, setTimeLeft] = useState(20);
  const [showTutorial, setShowTutorial] = useState(true);

  const canvasExportRef = useRef(null);
  const timerRef = useRef(null);

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
          if (!blob) return;

          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];

            const result = await model.generateContent([
              `Look at this drawing. Based on the lines, guess what it is. Return ONLY a comma-separated list of 3 most likely objects. e.g. "Cat, Dog, Bear". If it's empty, say "Nothing".`,
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

            // Check win condition (simple string matching)
            if (text.toLowerCase().includes(targetWord.toLowerCase())) {
              setGameStatus("won");
              clearInterval(timerRef.current);
            }
          };
        } catch (err) {
          console.error("AI Error:", err);
        }
      }, 3000); // Guess every 3 seconds
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

      <CameraFeed onHandData={setHandData} />

      <div className="ui-layer" style={{ position: 'absolute', top: 20, zIndex: 100, textAlign: 'center', width: '100%' }}>
        <div className="glass-panel" style={{ display: 'inline-block', minWidth: '300px' }}>
          {gameStatus === "idle" && (
            <div>
              <h1>AI Ocean Draw</h1>
              <p style={{ marginBottom: '1.5rem' }}>Pinch your fingers to draw!</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={startGame}>Start Game</button>
                <button onClick={() => setShowTutorial(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--primary)' }}>Tutorial</button>
              </div>
            </div>
          )}

          {gameStatus === "playing" && (
            <div>
              <h2>Draw: <span style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>{targetWord}</span></h2>
              <h3>Time: {timeLeft}s</h3>
              <div className="guesses" style={{ marginTop: '1rem' }}>
                <p>AI sees: <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{guesses.join(", ") || "..."}</span></p>
              </div>
            </div>
          )}

          {gameStatus === "won" && (
            <div>
              <h1 style={{ color: 'var(--primary)' }}>You Won!</h1>
              <p>It was indeed a {targetWord}</p>
              <button onClick={startGame}>Play Again</button>
            </div>
          )}

          {gameStatus === "lost" && (
            <div>
              <h1 style={{ color: '#f87171' }}>Time's Up!</h1>
              <button onClick={startGame}>Try Again</button>
            </div>
          )}
        </div>
      </div>

      <div className="canvas-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', position: 'relative', zIndex: 5 }}>
        <div className="canvas-container">
          <DrawingCanvas handResults={handData} exportRef={canvasExportRef} />
        </div>
      </div>

      <div className="debug-cursor" style={{
        position: 'absolute',
        opacity: 0.8,
        pointerEvents: 'none',
        zIndex: 150
        // We could render a cursor here based on handData for better UX
      }}>
        {handData && handData.multiHandLandmarks && handData.multiHandLandmarks[0] && (
          <div style={{
            position: 'fixed',
            left: `${(1 - handData.multiHandLandmarks[0][8].x) * 100}%`,
            top: `${handData.multiHandLandmarks[0][8].y * 100}%`,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            border: '3px solid white',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 15px var(--primary)'
          }} />
        )}
      </div>
    </div>
  );
}

export default App;
