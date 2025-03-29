import React from 'react';

interface SquareProps {
  position: string;
  piece?: string;
  onClick: (position: string) => void;
  selected?: boolean;
  highlighted?: boolean;
}

const Square: React.FC<SquareProps> = ({ position, piece, onClick, selected, highlighted }) => {
  const file = position.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(position[1], 10) - 1;
  const isDark = (file + rank) % 2 !== 0;
  let className = "square " + (isDark ? "dark" : "light") + (selected ? " selected" : "");
  return (
    <div className={className} onClick={() => onClick(position)}>
      {piece && <img src={`/assets/${piece}.png`} alt={piece} />}
      {highlighted && !piece && <div className="dot"></div>}
      {highlighted && piece && <div className="capture-marker"></div>}
    </div>
  );
};

interface ChessBoardProps {
  boardSetup: { [key: string]: string };
  onSquareClick: (position: string) => void;
  selectedSquare: string | null;
  highlightedSquares: string[];
  flipped?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ boardSetup, onSquareClick, selectedSquare, highlightedSquares, flipped = false }) => {
  const ranks = flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const files = flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
  let rows = [];
  for (let r of ranks) {
    let squares = [];
    for (let f of files) {
      const pos = `${f}${r}`;
      squares.push(
        <Square key={pos} position={pos} piece={boardSetup[pos]} onClick={onSquareClick} selected={selectedSquare === pos} highlighted={highlightedSquares.includes(pos)} />
      );
    }
    rows.push(
      <div key={r} className="board-row">
        {squares}
      </div>
    );
  }
  return <div className="chess-board">{rows}</div>;
};

export default ChessBoard;
