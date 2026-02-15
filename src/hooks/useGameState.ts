"use client";

import { useReducer, useCallback } from "react";
import {
  CellCoord,
  Difficulty,
  EliminationState,
  GameAction,
  GameState,
  PlayerLabel,
} from "@/lib/types";
import { generateMatrix, getMatrixSize } from "@/lib/matrix";
import { generateQuestion } from "@/lib/questions";
import { buildSequentialGame } from "@/lib/sequential";

function createFreshElimination(): EliminationState {
  return {
    eliminatedRows: [],
    eliminatedCols: [],
    circledPayoffs: [],
  };
}

function createNewGame(difficulty: Difficulty): Omit<GameState, "score"> {
  const { rows, cols } = getMatrixSize(difficulty);
  const matrix = generateMatrix(rows, cols, difficulty);

  // Build sequential game for hard mode
  let sequentialGame = null;
  if (difficulty === "hard") {
    const firstMover = Math.random() < 0.5 ? "A" as const : "B" as const;
    sequentialGame = buildSequentialGame(matrix, firstMover);
  }

  const question = generateQuestion(matrix, difficulty, sequentialGame ?? undefined);

  return {
    difficulty,
    matrix,
    sequentialGame,
    question,
    elimination: createFreshElimination(),
    selectedAnswer: null,
    isSubmitted: false,
    isCorrect: null,
  };
}

function createInitialState(): GameState {
  const game = createNewGame("easy");
  return {
    ...game,
    score: { correct: 0, total: 0 },
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME": {
      const game = createNewGame(state.difficulty);
      return {
        ...game,
        score: state.score,
      };
    }

    case "SET_DIFFICULTY": {
      const game = createNewGame(action.difficulty);
      return {
        ...game,
        score: { correct: 0, total: 0 },
      };
    }

    case "SELECT_ANSWER": {
      if (state.isSubmitted) return state;
      return {
        ...state,
        selectedAnswer: action.index,
      };
    }

    case "SUBMIT_ANSWER": {
      if (state.selectedAnswer === null || state.isSubmitted) return state;
      const isCorrect = state.selectedAnswer === state.question.correctIndex;
      return {
        ...state,
        isSubmitted: true,
        isCorrect,
        score: {
          correct: state.score.correct + (isCorrect ? 1 : 0),
          total: state.score.total + 1,
        },
      };
    }

    case "TOGGLE_ELIMINATE_ROW": {
      const rows = state.elimination.eliminatedRows.includes(action.row)
        ? state.elimination.eliminatedRows.filter((r) => r !== action.row)
        : [...state.elimination.eliminatedRows, action.row];
      return {
        ...state,
        elimination: { ...state.elimination, eliminatedRows: rows },
      };
    }

    case "TOGGLE_ELIMINATE_COL": {
      const cols = state.elimination.eliminatedCols.includes(action.col)
        ? state.elimination.eliminatedCols.filter((c) => c !== action.col)
        : [...state.elimination.eliminatedCols, action.col];
      return {
        ...state,
        elimination: { ...state.elimination, eliminatedCols: cols },
      };
    }

    case "TOGGLE_CIRCLE_PAYOFF": {
      const existing = state.elimination.circledPayoffs.findIndex(
        (cp) =>
          cp.coord.row === action.coord.row &&
          cp.coord.col === action.coord.col &&
          cp.player === action.player
      );
      const circled =
        existing >= 0
          ? state.elimination.circledPayoffs.filter((_, i) => i !== existing)
          : [
              ...state.elimination.circledPayoffs,
              { coord: action.coord, player: action.player },
            ];
      return {
        ...state,
        elimination: { ...state.elimination, circledPayoffs: circled },
      };
    }

    case "RESET_MARKINGS": {
      return {
        ...state,
        elimination: createFreshElimination(),
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const newGame = useCallback(() => dispatch({ type: "NEW_GAME" }), []);
  const setDifficulty = useCallback(
    (difficulty: Difficulty) => dispatch({ type: "SET_DIFFICULTY", difficulty }),
    []
  );
  const selectAnswer = useCallback(
    (index: number) => dispatch({ type: "SELECT_ANSWER", index }),
    []
  );
  const submitAnswer = useCallback(
    () => dispatch({ type: "SUBMIT_ANSWER" }),
    []
  );
  const toggleRow = useCallback(
    (row: number) => dispatch({ type: "TOGGLE_ELIMINATE_ROW", row }),
    []
  );
  const toggleCol = useCallback(
    (col: number) => dispatch({ type: "TOGGLE_ELIMINATE_COL", col }),
    []
  );
  const toggleCircle = useCallback(
    (coord: CellCoord, player: PlayerLabel) =>
      dispatch({ type: "TOGGLE_CIRCLE_PAYOFF", coord, player }),
    []
  );
  const resetMarkings = useCallback(
    () => dispatch({ type: "RESET_MARKINGS" }),
    []
  );

  return {
    state,
    newGame,
    setDifficulty,
    selectAnswer,
    submitAnswer,
    toggleRow,
    toggleCol,
    toggleCircle,
    resetMarkings,
  };
}
