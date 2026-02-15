import { DominationResult, PayoffMatrix, Strategy } from "./types";

export function findDominatedStrategies(
  matrix: PayoffMatrix
): DominationResult[] {
  const results: DominationResult[] = [];

  // Check Player A's rows
  for (let i = 0; i < matrix.rows; i++) {
    for (let j = 0; j < matrix.rows; j++) {
      if (i === j) continue;

      let allGreaterOrEqual = true;
      let someStrictlyGreater = false;
      let allStrictlyGreater = true;

      for (let c = 0; c < matrix.cols; c++) {
        const payoffI = matrix.cells[i][c].a;
        const payoffJ = matrix.cells[j][c].a;

        if (payoffJ < payoffI) {
          allGreaterOrEqual = false;
          allStrictlyGreater = false;
          break;
        }
        if (payoffJ > payoffI) {
          someStrictlyGreater = true;
        }
        if (payoffJ <= payoffI) {
          allStrictlyGreater = false;
        }
      }

      if (allStrictlyGreater || (allGreaterOrEqual && someStrictlyGreater)) {
        // Row i is dominated by row j
        // Only add if not already recorded
        const alreadyRecorded = results.some(
          (r) =>
            r.dominated.player === "A" &&
            r.dominated.index === i &&
            r.by.index === j
        );
        if (!alreadyRecorded) {
          results.push({
            dominated: {
              player: "A",
              index: i,
              label: matrix.rowLabels[i],
            },
            by: {
              player: "A",
              index: j,
              label: matrix.rowLabels[j],
            },
            strict: allStrictlyGreater,
          });
        }
      }
    }
  }

  // Check Player B's columns
  for (let c1 = 0; c1 < matrix.cols; c1++) {
    for (let c2 = 0; c2 < matrix.cols; c2++) {
      if (c1 === c2) continue;

      let allGreaterOrEqual = true;
      let someStrictlyGreater = false;
      let allStrictlyGreater = true;

      for (let r = 0; r < matrix.rows; r++) {
        const payoffC1 = matrix.cells[r][c1].b;
        const payoffC2 = matrix.cells[r][c2].b;

        if (payoffC2 < payoffC1) {
          allGreaterOrEqual = false;
          allStrictlyGreater = false;
          break;
        }
        if (payoffC2 > payoffC1) {
          someStrictlyGreater = true;
        }
        if (payoffC2 <= payoffC1) {
          allStrictlyGreater = false;
        }
      }

      if (allStrictlyGreater || (allGreaterOrEqual && someStrictlyGreater)) {
        const alreadyRecorded = results.some(
          (r) =>
            r.dominated.player === "B" &&
            r.dominated.index === c1 &&
            r.by.index === c2
        );
        if (!alreadyRecorded) {
          results.push({
            dominated: {
              player: "B",
              index: c1,
              label: matrix.colLabels[c1],
            },
            by: {
              player: "B",
              index: c2,
              label: matrix.colLabels[c2],
            },
            strict: allStrictlyGreater,
          });
        }
      }
    }
  }

  return results;
}
