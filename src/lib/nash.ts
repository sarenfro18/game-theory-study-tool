import { NashEquilibrium, PayoffMatrix } from "./types";

export function findNashEquilibria(matrix: PayoffMatrix): NashEquilibrium[] {
  const equilibria: NashEquilibrium[] = [];

  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      const payoffA = matrix.cells[r][c].a;
      const payoffB = matrix.cells[r][c].b;

      // Check if Player A's payoff is the best in this column
      let isBestForA = true;
      for (let r2 = 0; r2 < matrix.rows; r2++) {
        if (r2 !== r && matrix.cells[r2][c].a > payoffA) {
          isBestForA = false;
          break;
        }
      }

      // Check if Player B's payoff is the best in this row
      let isBestForB = true;
      for (let c2 = 0; c2 < matrix.cols; c2++) {
        if (c2 !== c && matrix.cells[r][c2].b > payoffB) {
          isBestForB = false;
          break;
        }
      }

      if (isBestForA && isBestForB) {
        equilibria.push({
          row: r,
          col: c,
          rowLabel: matrix.rowLabels[r],
          colLabel: matrix.colLabels[c],
          payoffs: matrix.cells[r][c],
        });
      }
    }
  }

  return equilibria;
}
