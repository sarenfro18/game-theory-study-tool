"use client";

interface FeedbackPanelProps {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
  onNewGame: () => void;
}

export function FeedbackPanel({
  isCorrect,
  explanation,
  correctAnswer,
  onNewGame,
}: FeedbackPanelProps) {
  return (
    <div
      className={`rounded-xl border-2 p-5 ${
        isCorrect
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      }`}
    >
      {/* Result banner */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{isCorrect ? "✓" : "✗"}</span>
        <span
          className={`text-lg font-bold ${
            isCorrect ? "text-green-700" : "text-red-700"
          }`}
        >
          {isCorrect ? "Correct!" : "Incorrect"}
        </span>
      </div>

      {/* Show correct answer if wrong */}
      {!isCorrect && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">Correct answer: </span>
          <span className="text-sm font-semibold text-gray-900">
            {correctAnswer}
          </span>
        </div>
      )}

      {/* Explanation */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">
          Explanation
        </h4>
        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {explanation}
        </div>
      </div>

      {/* Next game button */}
      <button
        onClick={onNewGame}
        className="w-full py-3 rounded-lg font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
      >
        Next Question →
      </button>
    </div>
  );
}
