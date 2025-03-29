import React from 'react';

interface SquareProps {
  position: string;
  piece?: string;
  onClick: (position: string) => void;
  selected?: boolean;
}

const Square: React.FC<SquareProps> = ({ position, piece, onClick, selected }) => {
  const file = position.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(position[1], 10) - 1;
  const isDark = (file + rank) % 2 !== 0;
  const className = "square " + (isDark ? "dark" : "light") + (selected ? " selected" : "");
  return (
    <div className={className} onClick={() => onClick(position)}>
      {piece && <img src={`/assets/${piece}.png`} alt={piece} />}
    </div>
  );
};

interface ChessBoardProps {
  boardSetup: { [key: string]: string };
  onSquareClick: (position: string) => void;
  selectedSquare: string | null;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ boardSetup, onSquareClick, selectedSquare }) => {
  const files = ['a','b','c','d','e','f','g','h'];
  let rows = [];
  for (let rank = 8; rank >= 1; rank--) {
    let squares = [];
    for (let i = 0; i < files.length; i++) {
      const pos = `${files[i]}${rank}`;
      squares.push(
        <Square key={pos} position={pos} piece={boardSetup[pos]} onClick={onSquareClick} selected={selectedSquare === pos} />
      );
    }
    rows.push(
      <div key={rank} className="board-row">
        {squares}
      </div>
    );
  }
  return <div className="chess-board">{rows}</div>;
};

export default ChessBoard;
