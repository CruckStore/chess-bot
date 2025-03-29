import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!game.game_over()) {
        if (game.turn() === 'w') {
          setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
        } else {
          setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [game]);

  const boardSetup = () => {
    let setup: { [key: string]: string } = {};
    const board = game.board();
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
      const piece = game.get(position);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(position);
        const moves = game.moves({ square: position, verbose: true }).map(m => m.to);
        setLegalMoves(moves);
      }
    } else {
      if (legalMoves.includes(position)) {
        game.move({ from: selectedSquare, to: position, promotion: 'q' });
        playSound();
        setGame(new Chess(game.fen()));
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const restartGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setLegalMoves([]);
    setWhiteTime(300);
    setBlackTime(300);
  };

  const undoMove = () => {
    game.undo();
    setGame(new Chess(game.fen()));
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const forfeit = () => {
    alert(`Les ${game.turn() === 'w' ? 'Blancs' : 'Noirs'} abandonnent !`);
    restartGame();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const turnText = game.turn() === 'w' ? "Blancs" : "Noirs";
  const history = game.history();

  return (
    <div className="app">
      <h1>Jeu d'échecs</h1>
      <div className="status">Tour: {turnText}</div>
      <div className="timers">
        <div className="timer">Blancs: {formatTime(whiteTime)}</div>
        <div className="timer">Noirs: {formatTime(blackTime)}</div>
      </div>
      <div className="controls">
        <button onClick={restartGame}>Recommencer</button>
        <button onClick={undoMove}>Annuler le dernier coup</button>
        <button onClick={toggleFlip}>Flip Board</button>
        <button onClick={forfeit}>Abandonner</button>
      </div>
      <div className="game-container">
        <ChessBoard boardSetup={boardSetup()} onSquareClick={handleSquareClick} selectedSquare={selectedSquare} highlightedSquares={legalMoves} flipped={isFlipped} />
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
  );
};

export default App;
