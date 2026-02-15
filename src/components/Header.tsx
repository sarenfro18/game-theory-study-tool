"use client";

import { Difficulty } from "@/lib/types";
import { DifficultySelector } from "./DifficultySelector";
import { NewGameButton } from "./NewGameButton";

interface HeaderProps {
  difficulty: Difficulty;
  score: { correct: number; total: number };
  onChangeDifficulty: (d: Difficulty) => void;
  onNewGame: () => void;
  onOpenGlossary: () => void;
}

export function Header({
  difficulty,
  score,
  onChangeDifficulty,
  onNewGame,
  onOpenGlossary,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
            Game Theory Study Tool
          </h1>
        </div>

        {/* Center: Difficulty */}
        <DifficultySelector
          difficulty={difficulty}
          onChangeDifficulty={onChangeDifficulty}
        />

        {/* Right: Score, Glossary, New Game */}
        <div className="flex items-center gap-2">
          {/* Score */}
          {score.total > 0 && (
            <span className="text-sm font-medium text-gray-600 px-2">
              {score.correct}/{score.total}
            </span>
          )}

          {/* Glossary button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Open glossary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="hidden sm:inline">Glossary</span>
          </button>

          <NewGameButton onNewGame={onNewGame} />
        </div>
      </div>
    </header>
  );
}
