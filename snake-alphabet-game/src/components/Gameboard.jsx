import { useEffect, useRef, useState } from 'react';
import { WORDS } from '../utils/word';
import './Gameboard.css';
import Prompt from './Prompt';
import CameraPanel from './CameraPanel';

const GRID_SIZE = 20;

function getNextLetterPosition(exclude, excludeLetters) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (
    exclude.some(p => p.x === pos.x && p.y === pos.y) ||
    excludeLetters.some(p => p.x === pos.x && p.y === pos.y)
  );
  return pos;
}

export default function Gameboard() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [wordIndex, setWordIndex] = useState(0);
  const [wordData, setWordData] = useState(WORDS[0]);
  const [letterIndex, setLetterIndex] = useState(0);
  const [letterPositions, setLetterPositions] = useState([]);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const placeLetters = (word, snakeHeadPos = { x: 10, y: 10 }) => {
    const positions = [];
    for (let i = 0; i < word.length; i++) {
      positions.push(getNextLetterPosition([snakeHeadPos], positions));
    }
    return positions;
  };

  const resetGame = (sameWord = false) => {
    const newSnake = [{ x: 10, y: 10 }];
    const nextWord = sameWord ? wordData : WORDS[(wordIndex + 1) % WORDS.length];
    const positions = placeLetters(nextWord.word);

    setSnake(newSnake);
    setDirection({ x: 1, y: 0 });
    setLetterIndex(0);
    setWordData(nextWord);
    setLetterPositions(positions);
    setGameOverReason(null);
    setPaused(false);
    setWordIndex(i => sameWord ? i : (i + 1) % WORDS.length);
  };

  useEffect(() => {
    if (wordData) {
      setLetterPositions(placeLetters(wordData.word));
    }
  }, [wordData]);

  useEffect(() => {
    const handleKey = (e) => {
      const dir = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      if (dir[e.key]) setDirection(dir[e.key]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (gameOverReason || paused) return;

    intervalRef.current = setInterval(() => {
      setSnake(prev => {
        const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };

        if (
          head.x < 0 || head.y < 0 ||
          head.x >= GRID_SIZE || head.y >= GRID_SIZE ||
          prev.some(s => s.x === head.x && s.y === head.y)
        ) {
          clearInterval(intervalRef.current);
          setGameOverReason('fail');
          return prev;
        }

        const newSnake = [head, ...prev];
        const currentLetterPos = letterPositions[letterIndex];

        const eatsCorrect = head.x === currentLetterPos?.x && head.y === currentLetterPos?.y;

        if (eatsCorrect) {
          const nextLetterIndex = letterIndex + 1;
          if (nextLetterIndex === wordData.word.length) {
            clearInterval(intervalRef.current);
            setGameOverReason('success');
            return newSnake;
          }
          setLetterIndex(nextLetterIndex);
        } else if (
          letterPositions.some((pos, idx) =>
            idx !== letterIndex && pos.x === head.x && pos.y === head.y)
        ) {
          clearInterval(intervalRef.current);
          setGameOverReason('fail');
          return newSnake;
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 200);

    return () => clearInterval(intervalRef.current);
  }, [direction, letterIndex, letterPositions, gameOverReason, paused]);

  if (gameOverReason === 'fail') {
    return (
      <div className="game-over">
        ❌ Wrong letter!<br />
        <button onClick={() => resetGame(true)}>🔁 Try Again</button>
      </div>
    );
  }

  if (gameOverReason === 'success') {
    return (
      <div className="game-over">
        🎉 Word Complete!<br />
        <button onClick={() => resetGame(false)}>➡ Next Word</button>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="camera-top-right">
        <CameraPanel onDirectionChange={(newDir) => {
          if ((newDir.x !== -direction.x || newDir.y !== -direction.y)) {
            setDirection(newDir);
          }
        }} />
      </div>

      <div className="game-area">
        <div className="prompt-above">
          <Prompt word={wordData.word} progress={letterIndex} />
          <button onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          {paused && <div className="paused-message">⏸ Game Paused</div>}
        </div>

        <img
          src={wordData.image}
          alt={wordData.word}
          className="word-image"
        />

        <div className="board">
          {[...Array(GRID_SIZE)].map((_, y) => (
            <div key={y} className="row">
              {[...Array(GRID_SIZE)].map((_, x) => {
                const isSnake = snake.some(s => s.x === x && s.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const letterIdx = letterPositions.findIndex(p => p.x === x && p.y === y);
                const letter = letterIdx !== -1 ? wordData.word[letterIdx] : '';
                const isEaten = letterIdx !== -1 && letterIdx < letterIndex;

                return (
                  <div
                    key={x}
                    className={`cell ${isSnake ? 'snake' : ''} ${isHead ? 'head' : ''}`}
                  >
                    {!isEaten && letter && <span className="letter">{letter}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
