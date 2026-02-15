"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { Header } from "./Header";
import { PayoffMatrix } from "./PayoffMatrix";
import { QuestionPanel } from "./QuestionPanel";
import { FeedbackPanel } from "./FeedbackPanel";
import { GlossaryModal } from "./GlossaryModal";
import { DecisionTree } from "./DecisionTree";

const DIFFICULTY_INFO = {
  easy: {
    label: "Simultaneous Game",
    description: "2x2 payoff matrix — find dominated strategies, Nash equilibria, and IEDS outcomes.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  medium: {
    label: "Simultaneous Game",
    description: "2x2 or 3x3 payoff matrix — includes willingness-to-pay and true/false questions.",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  hard: {
    label: "Sequential Game",
    description: "Payoff matrix with decision tree — backward induction and first-mover analysis.",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  find_dominated_strategies: "Dominated Strategies",
  ieds_survivors: "IEDS",
  nash_equilibrium: "Nash Equilibrium",
  residual_game: "Residual Game",
  count_nash: "Nash Equilibrium",
  true_false: "True / False",
  willingness_to_pay: "Willingness to Pay",
  sequential_first_mover: "Sequential Game",
  sequential_second_mover: "Sequential Game",
  consulting_offer: "Consulting Offer",
};

export function GameShell() {
  const {
    state,
    newGame,
    setDifficulty,
    selectAnswer,
    submitAnswer,
    toggleRow,
    toggleCol,
    toggleCircle,
    resetMarkings,
  } = useGameState();

  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const diffInfo = DIFFICULTY_INFO[state.difficulty];
  const categoryLabel = CATEGORY_LABELS[state.question.category] || "Question";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        difficulty={state.difficulty}
        score={state.score}
        onChangeDifficulty={setDifficulty}
        onNewGame={newGame}
        onOpenGlossary={() => setGlossaryOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Difficulty context banner */}
        <div
          className={`mb-6 px-4 py-3 rounded-lg border text-sm flex items-center justify-between ${diffInfo.color}`}
        >
          <div>
            <span className="font-semibold">{diffInfo.label}</span>
            <span className="mx-2">—</span>
            <span className="opacity-80">{diffInfo.description}</span>
          </div>
          <span className="text-xs font-mono opacity-60">
            {state.matrix.rows}x{state.matrix.cols}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Left: Matrix + Decision Tree */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
                Payoff Matrix
              </h2>
              <PayoffMatrix
                matrix={state.matrix}
                elimination={state.elimination}
                onToggleRow={toggleRow}
                onToggleCol={toggleCol}
                onCirclePayoff={toggleCircle}
                onResetMarkings={resetMarkings}
              />
            </div>

            {/* Decision Tree for hard mode */}
            {state.difficulty === "hard" && state.sequentialGame && (
              <DecisionTree
                game={state.sequentialGame}
                showSolution={state.isSubmitted}
              />
            )}
          </div>

          {/* Right: Question + Feedback */}
          <div className="flex flex-col gap-4">
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {categoryLabel}
              </span>
              <span className="text-xs text-gray-400">
                Question {state.score.total + (state.isSubmitted ? 0 : 1)}
              </span>
            </div>

            <QuestionPanel
              question={state.question}
              selectedAnswer={state.selectedAnswer}
              isSubmitted={state.isSubmitted}
              isCorrect={state.isCorrect}
              onSelectAnswer={selectAnswer}
              onSubmit={submitAnswer}
            />

            {state.isSubmitted && state.isCorrect !== null && (
              <FeedbackPanel
                isCorrect={state.isCorrect}
                explanation={state.question.explanation}
                correctAnswer={
                  state.question.options[state.question.correctIndex]
                }
                onNewGame={newGame}
              />
            )}
          </div>
        </div>
      </main>

      <GlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </div>
  );
}
