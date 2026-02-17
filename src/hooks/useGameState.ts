"use client";

import { useReducer, useCallback } from "react";
import {
  CellCoord,
  Difficulty,
  EliminationState,
  GameAction,
  GameState,
  Payoffs,
  PlayerLabel,
  TreeState,
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

function createFreshTreeState(): TreeState {
  return {
    highlightedEdges: [],
    leafPayoffs: {},
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
    treeState: createFreshTreeState(),
    selectedAnswer: null,
    selectedAnswers: [],
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

    case "TOGGLE_ANSWER": {
      if (state.isSubmitted) return state;
      const already = state.selectedAnswers.includes(action.index);
      const newSelected = already
        ? state.selectedAnswers.filter((i) => i !== action.index)
        : [...state.selectedAnswers, action.index];
      return {
        ...state,
        selectedAnswers: newSelected,
        // Keep selectedAnswer in sync for backward compatibility
        selectedAnswer: newSelected.length > 0 ? newSelected[0] : null,
      };
    }

    case "SUBMIT_ANSWER": {
      if (state.isSubmitted) return state;

      // Multi-select question
      if (state.question.multiSelect && state.question.correctIndices) {
        if (state.selectedAnswers.length === 0) return state;
        const correctSet = new Set(state.question.correctIndices);
        const selectedSet = new Set(state.selectedAnswers);
        const isCorrect =
          correctSet.size === selectedSet.size &&
          [...correctSet].every((i) => selectedSet.has(i));
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

      // Single-select question
      if (state.selectedAnswer === null) return state;
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

    case "SET_FIRST_MOVER": {
      if (state.difficulty !== "hard") return state;
      const newSeqGame = buildSequentialGame(state.matrix, action.player);
      return {
        ...state,
        sequentialGame: newSeqGame,
        treeState: createFreshTreeState(),
      };
    }

    case "TOGGLE_TREE_EDGE": {
      const existing = state.treeState.highlightedEdges.findIndex(
        (e) => e.parentId === action.parentId && e.edgeLabel === action.edgeLabel
      );
      const highlighted =
        existing >= 0
          ? state.treeState.highlightedEdges.filter((_, i) => i !== existing)
          : [...state.treeState.highlightedEdges, { parentId: action.parentId, edgeLabel: action.edgeLabel }];
      return {
        ...state,
        treeState: { ...state.treeState, highlightedEdges: highlighted },
      };
    }

    case "ASSIGN_LEAF_PAYOFF": {
      return {
        ...state,
        treeState: {
          ...state.treeState,
          leafPayoffs: {
            ...state.treeState.leafPayoffs,
            [action.leafId]: action.payoffs,
          },
        },
      };
    }

    case "CLEAR_LEAF_PAYOFF": {
      const { [action.leafId]: _, ...rest } = state.treeState.leafPayoffs;
      void _;
      return {
        ...state,
        treeState: {
          ...state.treeState,
          leafPayoffs: rest,
        },
      };
    }

    case "RESET_TREE": {
      return {
        ...state,
        treeState: createFreshTreeState(),
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
  const toggleAnswer = useCallback(
    (index: number) => dispatch({ type: "TOGGLE_ANSWER", index }),
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
  const setFirstMover = useCallback(
    (player: PlayerLabel) => dispatch({ type: "SET_FIRST_MOVER", player }),
    []
  );
  const toggleTreeEdge = useCallback(
    (parentId: string, edgeLabel: string) =>
      dispatch({ type: "TOGGLE_TREE_EDGE", parentId, edgeLabel }),
    []
  );
  const assignLeafPayoff = useCallback(
    (leafId: string, payoffs: Payoffs) =>
      dispatch({ type: "ASSIGN_LEAF_PAYOFF", leafId, payoffs }),
    []
  );
  const clearLeafPayoff = useCallback(
    (leafId: string) => dispatch({ type: "CLEAR_LEAF_PAYOFF", leafId }),
    []
  );
  const resetTree = useCallback(
    () => dispatch({ type: "RESET_TREE" }),
    []
  );

  return {
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
  };
}
