import { Difficulty, PayoffMatrix } from "./types";
import { randomInt, strategyLabel } from "./utils";
import { findDominatedStrategies } from "./dominated";
import { findNashEquilibria } from "./nash";

export function generateMatrix(
  rows: number,
  cols: number,
  difficulty: Difficulty
): PayoffMatrix {
  const [min, max] =
    difficulty === "easy" ? [0, 9] : [-5, 15];

  // ~30% of the time, try to generate a matrix with 2+ Nash Equilibria
  const wantMultipleNash = Math.random() < 0.3;

  for (let attempt = 0; attempt < 100; attempt++) {
    const cells: { a: number; b: number }[][] = [];
    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        cells[r][c] = { a: randomInt(min, max), b: randomInt(min, max) };
      }
    }

    const matrix: PayoffMatrix = {
      rows,
      cols,
      cells,
      rowLabels: Array.from({ length: rows }, (_, i) =>
        strategyLabel("A", i, rows)
      ),
      colLabels: Array.from({ length: cols }, (_, i) =>
        strategyLabel("B", i, cols)
      ),
    };

    if (isUsefulMatrix(matrix, difficulty, wantMultipleNash)) {
      return matrix;
    }
  }

  // If we wanted multiple NE but couldn't find one, try again without that constraint
  if (wantMultipleNash) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const cells: { a: number; b: number }[][] = [];
      for (let r = 0; r < rows; r++) {
        cells[r] = [];
        for (let c = 0; c < cols; c++) {
          cells[r][c] = { a: randomInt(min, max), b: randomInt(min, max) };
        }
      }

      const matrix: PayoffMatrix = {
        rows,
        cols,
        cells,
        rowLabels: Array.from({ length: rows }, (_, i) =>
          strategyLabel("A", i, rows)
        ),
        colLabels: Array.from({ length: cols }, (_, i) =>
          strategyLabel("B", i, cols)
        ),
      };

      if (isUsefulMatrix(matrix, difficulty, false)) {
        return matrix;
      }
    }
  }

  // Fallback: return the last generated matrix
  const cells: { a: number; b: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = { a: randomInt(min, max), b: randomInt(min, max) };
    }
  }

  return {
    rows,
    cols,
    cells,
    rowLabels: Array.from({ length: rows }, (_, i) =>
      strategyLabel("A", i, rows)
    ),
    colLabels: Array.from({ length: cols }, (_, i) =>
      strategyLabel("B", i, cols)
    ),
  };
}

function hasEqualPayoffs(matrix: PayoffMatrix): boolean {
  // For Player A: in each column, no two rows should give the same payoff
  for (let c = 0; c < matrix.cols; c++) {
    const payoffsInCol = new Set<number>();
    for (let r = 0; r < matrix.rows; r++) {
      if (payoffsInCol.has(matrix.cells[r][c].a)) return true;
      payoffsInCol.add(matrix.cells[r][c].a);
    }
  }

  // For Player B: in each row, no two columns should give the same payoff
  for (let r = 0; r < matrix.rows; r++) {
    const payoffsInRow = new Set<number>();
    for (let c = 0; c < matrix.cols; c++) {
      if (payoffsInRow.has(matrix.cells[r][c].b)) return true;
      payoffsInRow.add(matrix.cells[r][c].b);
    }
  }

  return false;
}

function isUsefulMatrix(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  wantMultipleNash: boolean = false
): boolean {
  // No equal payoffs for a player's options in any column/row
  if (hasEqualPayoffs(matrix)) return false;

  const dominated = findDominatedStrategies(matrix);
  const nash = findNashEquilibria(matrix);

  // If we want multiple Nash Equilibria, require at least 2
  if (wantMultipleNash && nash.length < 2) return false;

  if (difficulty === "easy") {
    // Easy mode: must have at least one dominated strategy AND at least one Nash equilibrium
    return dominated.length > 0 && nash.length > 0;
  }

  if (difficulty === "medium") {
    // Medium: at least one Nash equilibrium
    return nash.length > 0;
  }

  // Hard: just needs a Nash equilibrium
  return nash.length > 0;
}

export function getMatrixSize(difficulty: Difficulty): { rows: number; cols: number } {
  if (difficulty === "easy") {
    return { rows: 2, cols: 2 };
  }
  // Medium and hard: randomly 2x2 or 3x3
  const size = Math.random() < 0.5 ? 2 : 3;
  return { rows: size, cols: size };
}
