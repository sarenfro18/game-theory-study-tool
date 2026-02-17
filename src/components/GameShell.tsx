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
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  medium: {
    label: "Simultaneous Game",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  hard: {
    label: "Sequential Game",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  find_dominated_strategies: "Dominated Strategies",
  ieds_survivors: "IEDS",
  nash_equilibrium: "Nash Equilibrium",
  select_all_nash: "Nash Equilibrium",
  residual_game: "Residual Game",
  count_nash: "Nash Equilibrium",
  true_false: "True / False",
  willingness_to_pay: "Willingness to Pay",
  sequential_first_mover: "Sequential Game",
  sequential_second_mover: "Sequential Game",
  sequential_best_response: "Best Response",
  consulting_offer: "Consulting Offer",
};

export function GameShell() {
  const {
    state,
    newGame,
    setDifficulty,
    selectAnswer,
    toggleAnswer,
    submitAnswer,
    toggleRow,
    toggleCol,
    toggleCircle,
    resetMarkings,
    setFirstMover,
    toggleTreeEdge,
    assignLeafPayoff,
    clearLeafPayoff,
    resetTree,
  } = useGameState();

  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const diffInfo = DIFFICULTY_INFO[state.difficulty];
  const categoryLabel = CATEGORY_LABELS[state.question.category] || "Question";
  const isHardMode = state.difficulty === "hard";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        difficulty={state.difficulty}
        score={state.score}
        onChangeDifficulty={setDifficulty}
        onNewGame={newGame}
        onOpenGlossary={() => setGlossaryOpen(true)}
      />

      <main className={`mx-auto px-4 py-6 ${isHardMode ? "max-w-7xl" : "max-w-6xl"}`}>
        {/* Difficulty context banner */}
        <div
          className={`mb-6 px-4 py-3 rounded-lg border text-sm flex items-center justify-between ${diffInfo.color}`}
        >
          <span className="font-semibold">{diffInfo.label}</span>
          <span className="text-xs font-mono opacity-60">
            {state.matrix.rows}x{state.matrix.cols}
          </span>
        </div>

        {isHardMode ? (
          /* Hard mode: matrix + tree side-by-side, question below */
          <div className="flex flex-col gap-6">
            {/* Top row: Matrix + Decision Tree side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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

              {state.sequentialGame && (
                <DecisionTree
                  game={state.sequentialGame}
                  showSolution={state.isSubmitted}
                  highlightedEdges={state.treeState.highlightedEdges}
                  leafPayoffs={state.treeState.leafPayoffs}
                  matrix={state.matrix}
                  onToggleEdge={toggleTreeEdge}
                  onAssignLeaf={assignLeafPayoff}
                  onClearLeaf={clearLeafPayoff}
                  onResetTree={resetTree}
                  onSetFirstMover={setFirstMover}
                />
              )}
            </div>

            {/* Bottom: Question + Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                  selectedAnswers={state.selectedAnswers}
                  isSubmitted={state.isSubmitted}
                  isCorrect={state.isCorrect}
                  onSelectAnswer={selectAnswer}
                  onToggleAnswer={toggleAnswer}
                  onSubmit={submitAnswer}
                />
              </div>

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
        ) : (
          /* Easy/Medium mode: original 2-column layout */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            {/* Left: Matrix */}
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
                selectedAnswers={state.selectedAnswers}
                isSubmitted={state.isSubmitted}
                isCorrect={state.isCorrect}
                onSelectAnswer={selectAnswer}
                onToggleAnswer={toggleAnswer}
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
        )}
      </main>

      <GlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </div>
  );
}
