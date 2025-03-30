import React, { useEffect } from 'react';
import { Game, aiMove } from 'js-chess-engine';

interface BotProps {
  game: Game;
  gameState: any;
  botEnabled: boolean;
  onMove: () => void;
}

const Bot: React.FC<BotProps> = ({ game, gameState, botEnabled, onMove }) => {
  useEffect(() => {
    if (botEnabled && gameState.turn === 'black' && !gameState.isFinished) {
      const timer = setTimeout(() => {
        game.aiMove(4);
        onMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [botEnabled, gameState.turn, gameState.isFinished, onMove, game]);
  return null;
};

export default Bot;
