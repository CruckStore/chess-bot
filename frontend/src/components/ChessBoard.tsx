import React from "react";

interface SquareProps {
  position: string;
  piece?: string;
  onDragStart: (from: string) => void;
  onDragEnd: () => void;
  onClick: (position: string) => void;
  onDropPiece: (from: string, to: string) => void;
  selected?: boolean;
  highlighted?: boolean;
  lastMove?: boolean;
  suggestion?: boolean;
}

const Square: React.FC<SquareProps> = ({
  position,
  piece,
  onClick,
  onDropPiece,
  onDragStart,
  onDragEnd,
  selected,
  highlighted,
  lastMove,
  suggestion,
}) => {
  const file = position.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(position[1], 10) - 1;
  const isDark = (file + rank) % 2 !== 0;
  let className = "square " + (isDark ? "dark" : "light");
  if (selected) className += " selected";
  if (lastMove) className += " last-move";
  if (suggestion) className += " suggestion";

  return (
    <div
      className={className}
      onClick={() => onClick(position)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData("from");
        onDropPiece(from, position);
      }}
    >
      {piece && (
        <img
          src={`/assets/${piece}.png`}
          alt={piece}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("from", position);
            onDragStart(position);
          }}
          onDragEnd={() => {
            onDragEnd();
          }}
        />
      )}
      {highlighted && !piece && <div className="dot"></div>}
      {highlighted && piece && <div className="capture-marker"></div>}
    </div>
  );
};

interface ChessBoardProps {
  boardSetup: { [key: string]: string };
  onSquareClick: (position: string) => void;
  onDropPiece: (from: string, to: string) => void;
  onDragStart: (from: string) => void;
  onDragEnd: () => void;
  selectedSquare: string | null;
  highlightedSquares: string[];
  flipped?: boolean;
  lastMove?: string[];
  suggestedMove?: string[] | null;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  boardSetup,
  onSquareClick,
  onDropPiece,
  onDragStart,
  onDragEnd,
  selectedSquare,
  highlightedSquares,
  flipped = false,
  lastMove = [],
  suggestedMove = null,
}) => {
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = flipped
    ? ["h", "g", "f", "e", "d", "c", "b", "a"]
    : ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className="chess-board">
      {ranks.map((r) => (
        <div key={r} className="board-row">
          {files.map((f) => {
            const pos = `${f}${r}`;
            return (
              <Square
                key={pos}
                position={pos}
                piece={boardSetup[pos]}
                onClick={onSquareClick}
                onDropPiece={onDropPiece}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                selected={selectedSquare === pos}
                highlighted={highlightedSquares.includes(pos)}
                lastMove={lastMove.includes(pos)}
                suggestion={suggestedMove ? suggestedMove.includes(pos) : false}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
