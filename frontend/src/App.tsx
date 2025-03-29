import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';

const BOT_DEPTH = 3;

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
  const [endGameMessage, setEndGameMessage] = useState<string | null>(null);
  const [botEnabled, setBotEnabled] = useState(false);

  // Évaluation simple du plateau (en centi-pions)
  const evaluateBoard = (game: Chess): number => {
    const pieceValue: { [key: string]: number } = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000
    };
    let evaluation = 0;
    const board = game.board();
    for (const row of board) {
      for (const piece of row) {
        if (piece) {
          const value = pieceValue[piece.type] || 0;
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
    }
    return evaluation;
  };

  const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    if (depth === 0 || game.isGameOver()) {
      return evaluateBoard(game);
    }
    const moves = game.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evalValue = minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evalValue);
        alpha = Math.max(alpha, evalValue);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evalValue = minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evalValue);
        beta = Math.min(beta, evalValue);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const getBestMove = (game: Chess, depth: number): { from: string, to: string } | null => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    const currentTurn = game.turn();
    let bestMove: any = null;
    let bestEval = currentTurn === 'w' ? -Infinity : Infinity;
    for (const move of moves) {
      game.move(move);
      const evalValue = minimax(game, depth - 1, -Infinity, Infinity, game.turn() === 'w');
      game.undo();
      if (currentTurn === 'w') {
        if (evalValue > bestEval) {
          bestEval = evalValue;
          bestMove = move;
        }
      } else {
        if (evalValue < bestEval) {
          bestEval = evalValue;
          bestMove = move;
        }
      }
    }
    return bestMove ? { from: bestMove.from, to: bestMove.to } : null;
  };

  useEffect(() => {
    if (gameStarted && gameRef.current.isGameOver()) {
      let message = "";
      if (gameRef.current.isCheckmate()) {
        const winningMove = lastMove.length === 2 ? ` (Coup: ${lastMove[0]} → ${lastMove[1]})` : "";
        message = `Bravo ! Échec et mat ! ${gameRef.current.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent !${winningMove}`;
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
      setEndGameMessage(message);
    }
  }, [update, gameStarted, lastMove]);

  useEffect(() => {
    if (
      gameStarted &&
      botEnabled &&
      gameRef.current.turn() === 'b' &&
      !selectedSquare &&
      !gameRef.current.isGameOver()
    ) {
      const botTimer = setTimeout(() => {
        const bestMove = getBestMove(gameRef.current, BOT_DEPTH);
        if (bestMove) {
          gameRef.current.move({ from: bestMove.from, to: bestMove.to, promotion: 'q' });
          setLastMove([bestMove.from, bestMove.to]);
          playSound();
          setUpdate(u => u + 1);
        }
      }, 500);
      return () => clearTimeout(botTimer);
    }
  }, [update, botEnabled, gameStarted, selectedSquare]);

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
    setEndGameMessage(null);
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

  const rankLabels = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const fileLabels = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
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
        <button onClick={() => setBotEnabled(!botEnabled)}>
          {botEnabled ? "Désactiver Bot (Noir)" : "Activer Bot (Noir)"}
        </button>
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
      {endGameMessage && (
        <div className="endgame-overlay">
          <div className="endgame-message">
            <h2>{endGameMessage}</h2>
            <button onClick={() => { setEndGameMessage(null); restartGame(); }}>
              Recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
