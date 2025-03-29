import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const App: React.FC = () => {
  const gameRef = useRef(new Chess());
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [initialTime, setInitialTime] = useState(5);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [lastMove, setLastMove] = useState<string[]>([]);
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    if (gameStarted) {
      const initialSeconds = initialTime * 60;
      setWhiteTime(initialSeconds);
      setBlackTime(initialSeconds);
    }
  }, [gameStarted, initialTime]);

  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      if (gameRef.current.game_over()) {
        clearInterval(interval);
        return;
      }
      if (gameRef.current.turn() === 'w') {
        setWhiteTime(prev => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted]);

  const boardSetup = () => {
    let setup: { [key: string]: string } = {};
    const board = gameRef.current.board();
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const piece = board[r][c];
        if (piece) {
          const file = String.fromCharCode('a'.charCodeAt(0) + c);
          const rank = 8 - r;
          setup[`${file}${rank}`] = piece.color + piece.type.toUpperCase();
        }
      }
    }
    return setup;
  };

  const playSound = () => {
    if (!isSoundOn) return;
    const audio = new Audio("/assets/move.mp3");
    audio.play();
  };

  const handleSquareClick = (position: string) => {
    if (selectedSquare === position) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    if (!selectedSquare) {
      const piece = gameRef.current.get(position);
      if (piece && piece.color === gameRef.current.turn()) {
        setSelectedSquare(position);
        const moves = gameRef.current.moves({ square: position, verbose: true }).map(m => m.to);
        setLegalMoves(moves);
      }
    } else {
      if (legalMoves.includes(position)) {
        const move = gameRef.current.move({ from: selectedSquare, to: position, promotion: 'q' });
        if (move) {
          setLastMove([selectedSquare, position]);
          playSound();
          setUpdate(u => u + 1);
        }
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const restartGame = () => {
    gameRef.current = new Chess();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove([]);
    const initialSeconds = initialTime * 60;
    setWhiteTime(initialSeconds);
    setBlackTime(initialSeconds);
    setUpdate(u => u + 1);
  };

  const undoMove = () => {
    const history = gameRef.current.history({ verbose: true });
    if (history.length === 0) return;
    gameRef.current.undo();
    setLastMove([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setUpdate(u => u + 1);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const forfeit = () => {
    alert(`Les ${gameRef.current.turn() === 'w' ? 'Blancs' : 'Noirs'} abandonnent !`);
    restartGame();
  };

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
  };

  const suggestMove = () => {
    const moves = gameRef.current.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      alert(`Suggestion: ${randomMove}`);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const startGame = () => {
    gameRef.current = new Chess();
    setGameStarted(true);
    const initialSeconds = initialTime * 60;
    setWhiteTime(initialSeconds);
    setBlackTime(initialSeconds);
    setUpdate(u => u + 1);
  };

  const history = gameRef.current.history();

  if (!gameStarted) {
    return (
      <div className="app">
        <h1>Réglages de la partie</h1>
        <div>
          <label>Temps initial (minutes): </label>
          <input
            type="number"
            value={initialTime}
            onChange={e => setInitialTime(parseInt(e.target.value) || 0)}
            min="1"
          />
        </div>
        <button onClick={startGame}>Démarrer la partie</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Jeu d'échecs</h1>
      <div className="controls">
        <button onClick={restartGame}>Recommencer</button>
        <button onClick={undoMove}>Annuler le dernier coup</button>
        <button onClick={toggleFlip}>Flip Board</button>
        <button onClick={forfeit}>Abandonner</button>
        <button onClick={toggleSound}>{isSoundOn ? "Mute" : "Unmute"}</button>
        <button onClick={suggestMove}>Suggestion</button>
      </div>
      <div className="game-container">
        <ChessBoard boardSetup={boardSetup()} onSquareClick={handleSquareClick} selectedSquare={selectedSquare} highlightedSquares={legalMoves} flipped={isFlipped} lastMove={lastMove} />
        <div className="side-panel">
          <div className="clocks">
            <div className="timer">Blancs: {formatTime(whiteTime)}</div>
            <div className="timer">Noirs: {formatTime(blackTime)}</div>
          </div>
          <div className="move-history">
            <h2>Historique</h2>
            <ol>
              {history.map((move, index) => (
                <li key={index}>{move}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
