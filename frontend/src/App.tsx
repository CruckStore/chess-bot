import React, { useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

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
        setGame(new Chess(game.fen()));
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const restartGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setLegalMoves([]);
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

  const turnText = game.turn() === 'w' ? "Blancs" : "Noirs";
  const history = game.history();

  return (
    <div className="app">
      <h1>Jeu d'échecs</h1>
      <div className="status">Tour: {turnText}</div>
      <div className="controls">
        <button onClick={restartGame}>Recommencer</button>
        <button onClick={undoMove}>Annuler</button>
        <button onClick={toggleFlip}>Flip Board</button>
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
