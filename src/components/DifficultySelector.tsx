"use client";

import { Difficulty } from "@/lib/types";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function DifficultySelector({
  difficulty,
  onChangeDifficulty,
}: DifficultySelectorProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          onClick={() => onChangeDifficulty(d.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            difficulty === d.value
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
