import {
  CellCoord,
  IEDSResult,
  IEDSStep,
  PayoffMatrix,
} from "./types";
import { deepClone } from "./utils";

export function performIEDS(matrix: PayoffMatrix): IEDSResult {
  const steps: IEDSStep[] = [];
  const activeRows = new Set(Array.from({ length: matrix.rows }, (_, i) => i));
  const activeCols = new Set(Array.from({ length: matrix.cols }, (_, i) => i));

  let changed = true;
  while (changed) {
    changed = false;

    // Check rows for Player A (strict domination)
    for (const i of activeRows) {
      for (const j of activeRows) {
        if (i === j) continue;

        let allStrictlyGreater = true;
        for (const c of activeCols) {
          if (matrix.cells[j][c].a <= matrix.cells[i][c].a) {
            allStrictlyGreater = false;
            break;
          }
        }

        if (allStrictlyGreater) {
          activeRows.delete(i);
          steps.push({
            eliminated: {
              player: "A",
              index: i,
              label: matrix.rowLabels[i],
            },
            reason: `Player A's strategy "${matrix.rowLabels[i]}" is strictly dominated by "${matrix.rowLabels[j]}". For every column, ${matrix.rowLabels[j]} gives Player A a higher payoff.`,
          });
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (changed) continue;

    // Check columns for Player B (strict domination)
    for (const c1 of activeCols) {
      for (const c2 of activeCols) {
        if (c1 === c2) continue;

        let allStrictlyGreater = true;
        for (const r of activeRows) {
          if (matrix.cells[r][c2].b <= matrix.cells[r][c1].b) {
            allStrictlyGreater = false;
            break;
          }
        }

        if (allStrictlyGreater) {
          activeCols.delete(c1);
          steps.push({
            eliminated: {
              player: "B",
              index: c1,
              label: matrix.colLabels[c1],
            },
            reason: `Player B's strategy "${matrix.colLabels[c1]}" is strictly dominated by "${matrix.colLabels[c2]}". For every row, ${matrix.colLabels[c2]} gives Player B a higher payoff.`,
          });
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  // Build surviving cells
  const survivingCells: CellCoord[] = [];
  for (const r of activeRows) {
    for (const c of activeCols) {
      survivingCells.push({ row: r, col: c });
    }
  }

  // Build residual matrix
  const activeRowArr = Array.from(activeRows).sort((a, b) => a - b);
  const activeColArr = Array.from(activeCols).sort((a, b) => a - b);

  let residualMatrix: PayoffMatrix | null = null;
  if (activeRowArr.length > 0 && activeColArr.length > 0) {
    residualMatrix = {
      rows: activeRowArr.length,
      cols: activeColArr.length,
      cells: activeRowArr.map((r) =>
        activeColArr.map((c) => deepClone(matrix.cells[r][c]))
      ),
      rowLabels: activeRowArr.map((r) => matrix.rowLabels[r]),
      colLabels: activeColArr.map((c) => matrix.colLabels[c]),
    };
  }

  return { steps, survivingCells, residualMatrix };
}
