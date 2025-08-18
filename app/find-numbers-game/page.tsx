
"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './FindNumbersGame.module.css';

interface Ranking {
  id: number;
  created_at: string;
  name: string;
  time: number;
  game_mode: string;
}

const FindNumbersGamePage = () => {
  const [gridSize, setGridSize] = useState(4);
  const [maxNumber, setMaxNumber] = useState(16);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [blinkedSquares, setBlinkedSquares] = useState<number[]>([]);
  const [view, setView] = useState('game');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [rankingGameMode, setRankingGameMode] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatMilliseconds = (ms: number) => (ms / 1000).toFixed(3);

  const handleDifficultyChange = (size: number) => {
    setGridSize(size);
    setMaxNumber(size * size);
    setGameActive(false);
    setShowResultModal(false);
  };

  const initializeGrid = () => {
    const newNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
    for (let i = newNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newNumbers[i], newNumbers[j]] = [newNumbers[j], newNumbers[i]];
    }
    setNumbers(newNumbers);
  };

  const handleSquareClick = (num: number) => {
    if (!gameActive) return;

    if (num === currentTarget) {
      setBlinkedSquares((prev) => [...prev, num]);
      setTimeout(() => {
        setBlinkedSquares((prev) => prev.filter((n) => n !== num));
      }, 500);

      if (currentTarget === maxNumber) {
        endGame();
      } else {
        setCurrentTarget((prev) => prev + 1);
      }
    }
  };

  const startGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCurrentTarget(1);
    setTimeElapsed(0);
    setShowResultModal(false);
    initializeGrid();
    setGameActive(true);
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setTimeElapsed(performance.now() - startTimeRef.current);
    }, 1);
  };

  const endGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameActive(false);
    setShowResultModal(true);
  };

  const handlePlayAgain = () => {
    setShowResultModal(false);
    startGame();
  };

  const fetchRankings = async (gameMode: number) => {
    try {
      const res = await fetch(`/api/rankings?game_mode=${gameMode}`);
      if (!res.ok) {
        throw new Error('Failed to fetch rankings');
      }
      const data = await res.json();
      setRankings(data);
    } catch (error) {
      setError('Could not load rankings.');
    }
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/rankings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName, time: timeElapsed / 1000, game_mode: gridSize }),
      });

      if (!res.ok) {
        throw new Error('Failed to save score');
      }

      setShowResultModal(false);
      setView('ranking');
      setRankingGameMode(gridSize);
    } catch (error) {
      setError('Could not save score.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    initializeGrid();
  }, [maxNumber]);

  const handleViewRankings = () => {
    setGameActive(false);
    setView('ranking');
    setRankingGameMode(gridSize);
  };

  useEffect(() => {
    if (view === 'ranking') {
      fetchRankings(rankingGameMode);
    }
  }, [view, rankingGameMode]);

  if (view === 'ranking') {
    return (
      <div className={styles.body}>
        <div className={styles.rankingContainer}>
          <h1 className={styles.h1}>Rankings</h1>
          <div className={styles.difficultyControls}>
            <button
              className={`${styles.difficultyBtn} ${rankingGameMode === 4 ? styles.active : ''}`}
              onClick={() => setRankingGameMode(4)}
            >
              4×4
            </button>
            <button
              className={`${styles.difficultyBtn} ${rankingGameMode === 5 ? styles.active : ''}`}
              onClick={() => setRankingGameMode(5)}
            >
              5×5
            </button>
            <button
              className={`${styles.difficultyBtn} ${rankingGameMode === 6 ? styles.active : ''}`}
              onClick={() => setRankingGameMode(6)}
            >
              6×6
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <table className={styles.rankingTable}>
            <thead>
              <tr>
                <th>Position</th>
                <th>Name</th>
                <th>Time (s)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.id}>
                  <td className={styles.position}>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.time.toFixed(3)}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.navButtons}>
            <button className={styles.navButton} onClick={() => setView('game')}>
              Back to Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <h1 className={styles.h1}>Find Numbers Game</h1>

        <div className={styles.difficultyControls}>
          <button
            className={`${styles.difficultyBtn} ${gridSize === 4 ? styles.active : ''}`}
            onClick={() => handleDifficultyChange(4)}
          >
            16 Squares (4×4)
          </button>
          <button
            className={`${styles.difficultyBtn} ${gridSize === 5 ? styles.active : ''}`}
            onClick={() => handleDifficultyChange(5)}
          >
            25 Squares (5×5)
          </button>
          <button
            className={`${styles.difficultyBtn} ${gridSize === 6 ? styles.active : ''}`}
            onClick={() => handleDifficultyChange(6)}
          >
            36 Squares (6×6)
          </button>
        </div>

        <div className={styles.difficultyInfo}>
          {`Grid: ${gridSize}×${gridSize} (${maxNumber} squares)`}
        </div>

        <div className={styles.gameInfo}>
          <div className={styles.timer}>Time: <span>{formatMilliseconds(timeElapsed)}</span>s</div>
          <div className={styles.target}>Find: <span>{currentTarget}</span></div>
        </div>

        <div className={`${styles.grid} ${styles[`grid-${gridSize}x${gridSize}`]}`}>
          {numbers.map((num) => (
            <div
              key={num}
              className={`${styles.square} ${blinkedSquares.includes(num) ? styles.blink : ''}`}
              onClick={() => handleSquareClick(num)}
            >
              {num}
            </div>
          ))}
        </div>

        <button onClick={startGame} className={styles.button}>
          {gameActive ? 'Restart Game' : 'Start Game'}
        </button>

        <div className={styles.navButtons}>
          <button className={styles.navButton} onClick={handleViewRankings}>
            View Rankings
          </button>
        </div>
      </div>

      {showResultModal && (
        <div className={`${styles.resultModal} ${styles.active}`}>
          <div className={styles.resultContent}>
            <h2 className={styles.h2}>Game Complete!</h2>
            <p className={styles.p}>You found all numbers in sequence!</p>
            <div className={styles.difficultyInfo}>
              {`Difficulty: ${gridSize}×${gridSize} (${maxNumber} squares)`}
            </div>
            <div className={styles.timeLeft}>
              Time: <span>{formatMilliseconds(timeElapsed)}</span>s
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={styles.nameInput}
              placeholder="Your Name"
            />
            {error && <div className={styles.error}>{error}</div>}
            <button onClick={handleSaveScore} className={styles.button} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Score'}
            </button>
            <button
              onClick={handlePlayAgain}
              className={`${styles.button} ${styles.playAgain}`}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindNumbersGamePage;
