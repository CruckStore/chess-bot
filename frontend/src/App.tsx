import React, { useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
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
    if (!selectedSquare) {
      const piece = game.get(position);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(position);
      }
    } else {
      const move = game.move({ from: selectedSquare, to: position, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
      }
      setSelectedSquare(null);
    }
  };

  return (
    <div className="app">
      <h1>Chess</h1>
      <ChessBoard boardSetup={boardSetup()} onSquareClick={handleSquareClick} selectedSquare={selectedSquare} />
    </div>
  );
};

export default App;
