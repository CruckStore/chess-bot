import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const App: React.FC = () => {
  const gameRef = useRef(new Chess());
  const [gameStarted, setGameStarted] = useState(false);
  const [setupMode, setSetupMode] = useState<"standard" | "custom">("standard");
  const [customFEN, setCustomFEN] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<string[]>([]);
  const [suggestedMove, setSuggestedMove] = useState<string[] | null>(null);
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    if (gameStarted && gameRef.current.isGameOver()) {
      let message = "";
      if (gameRef.current.isCheckmate()) {
        message = `Échec et mat ! ${gameRef.current.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent !`;
      } else if (gameRef.current.isStalemate()) {
        message = "Pat !";
      } else if (gameRef.current.isThreefoldRepetition()) {
        message = "Partie nulle par répétition !";
      } else if (gameRef.current.isInsufficientMaterial()) {
        message = "Partie nulle par matériel insuffisant !";
      } else if (gameRef.current.isDraw()) {
        message = "Partie nulle !";
      } else {
        message = "Fin de partie !";
      }
      alert(message);
    }
  }, [update, gameStarted]);

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
    if (setupMode === "custom" && customFEN.trim() !== "") {
      try {
        gameRef.current = new Chess(customFEN);
      } catch (error) {
        alert("FEN invalide !");
        return;
      }
    } else {
      gameRef.current = new Chess();
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove([]);
    setSuggestedMove(null);
    setUpdate(u => u + 1);
  };

  const undoMove = () => {
    if (gameRef.current.history().length === 0) return;
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

  const handleSuggestion = () => {
    const moves = gameRef.current.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      setSuggestedMove([randomMove.from, randomMove.to]);
      setTimeout(() => setSuggestedMove(null), 3000);
    }
  };

  const startGame = () => {
    if (setupMode === "custom" && customFEN.trim() !== "") {
      try {
        gameRef.current = new Chess(customFEN);
      } catch (error) {
        alert("FEN invalide !");
        return;
      }
    } else {
      gameRef.current = new Chess();
    }
    setGameStarted(true);
    setUpdate(u => u + 1);
  };

  const rankLabels = isFlipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const fileLabels = isFlipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
  const history = gameRef.current.history();

  if (!gameStarted) {
    return (
      <div className="app">
        <h1>Réglages de la partie</h1>
        <div>
          <label>
            <input
              type="radio"
              value="standard"
              checked={setupMode === "standard"}
              onChange={() => setSetupMode("standard")}
            />
            Position Standard
          </label>
          <label>
            <input
              type="radio"
              value="custom"
              checked={setupMode === "custom"}
              onChange={() => setSetupMode("custom")}
            />
            Position Personnalisée
          </label>
        </div>
        {setupMode === "custom" && (
          <div>
            <label>FEN de départ: </label>
            <input
              type="text"
              value={customFEN}
              onChange={e => setCustomFEN(e.target.value)}
              placeholder="Entrez la FEN"
              style={{ width: '300px' }}
            />
          </div>
        )}
        <button onClick={startGame}>Démarrer la partie</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Jeu d'échecs</h1>
      <div className="top-controls">
        <button onClick={restartGame}>Recommencer</button>
        <button onClick={undoMove}>Annuler le dernier coup</button>
        <button onClick={toggleFlip}>Flip Board</button>
        <button onClick={forfeit}>Abandonner</button>
      </div>
      <div className="board-container">
        <div className="board-with-ranks">
          <div className="rank-labels">
            {rankLabels.map(r => <div key={r} className="rank-label">{r}</div>)}
          </div>
          <ChessBoard
            boardSetup={boardSetup()}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            highlightedSquares={legalMoves}
            flipped={isFlipped}
            lastMove={lastMove}
            suggestedMove={suggestedMove}
          />
        </div>
        <div className="file-labels">
          {fileLabels.map(f => <div key={f} className="file-label">{f}</div>)}
        </div>
      </div>
      <div className="side-panel">
        <div className="move-history">
          <h2>Historique</h2>
          <ol>
            {history.map((move, index) => (
              <li key={index}>{move}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="bottom-controls">
        <button onClick={handleSuggestion}>Suggestion</button>
      </div>
    </div>
  );
};

export default App;
