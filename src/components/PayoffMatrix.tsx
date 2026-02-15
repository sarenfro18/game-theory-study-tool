"use client";

import { CellCoord, EliminationState, PayoffMatrix as PayoffMatrixType, PlayerLabel } from "@/lib/types";
import { PayoffCell } from "./PayoffCell";

interface PayoffMatrixProps {
  matrix: PayoffMatrixType;
  elimination: EliminationState;
  onToggleRow: (row: number) => void;
  onToggleCol: (col: number) => void;
  onCirclePayoff: (coord: CellCoord, player: PlayerLabel) => void;
  onResetMarkings: () => void;
}

export function PayoffMatrix({
  matrix,
  elimination,
  onToggleRow,
  onToggleCol,
  onCirclePayoff,
  onResetMarkings,
}: PayoffMatrixProps) {
  const isCircled = (row: number, col: number, player: PlayerLabel) =>
    elimination.circledPayoffs.some(
      (cp) =>
        cp.coord.row === row &&
        cp.coord.col === col &&
        cp.player === player
    );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-start gap-0">
        {/* Player A label on the left side */}
        <div className="flex flex-col items-center justify-center mr-2 pt-10" style={{ minHeight: `${matrix.rows * 96 + 40}px` }}>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-blue-700 font-semibold text-xs tracking-wide [writing-mode:vertical-lr] rotate-180">
              Player A
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Player B label on top */}
          <div className="flex items-center gap-1.5 mb-2 ml-20">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-700 font-semibold text-xs tracking-wide">
              Player B
            </span>
          </div>

          <div className="inline-block">
            <table className="border-collapse">
              <thead>
                <tr>
                  {/* Corner cell */}
                  <th className="w-20 h-10 text-xs text-gray-500 font-normal border border-gray-200 bg-gray-50">
                    A ╲ B
                  </th>
                  {/* Column headers (Player B strategies) */}
                  {matrix.colLabels.map((label, c) => (
                    <th
                      key={c}
                      onClick={() => onToggleCol(c)}
                      className={`w-24 h-10 text-sm font-semibold border border-gray-200 cursor-pointer transition-colors select-none ${
                        elimination.eliminatedCols.includes(c)
                          ? "bg-gray-300 text-gray-500 line-through"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                      title="Click to eliminate/restore this column"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: matrix.rows }, (_, r) => (
                  <tr key={r}>
                    {/* Row header (Player A strategy) */}
                    <td
                      onClick={() => onToggleRow(r)}
                      className={`w-20 h-24 text-sm font-semibold text-center border border-gray-200 cursor-pointer transition-colors select-none ${
                        elimination.eliminatedRows.includes(r)
                          ? "bg-gray-300 text-gray-500 line-through"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                      title="Click to eliminate/restore this row"
                    >
                      {matrix.rowLabels[r]}
                    </td>
                    {/* Cells */}
                    {Array.from({ length: matrix.cols }, (_, c) => (
                      <td key={c} className="p-0 border border-gray-300">
                        <PayoffCell
                          payoffs={matrix.cells[r][c]}
                          coord={{ row: r, col: c }}
                          isEliminated={
                            elimination.eliminatedRows.includes(r) ||
                            elimination.eliminatedCols.includes(c)
                          }
                          circledA={isCircled(r, c, "A")}
                          circledB={isCircled(r, c, "B")}
                          onCirclePayoff={onCirclePayoff}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Helper text and reset */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Click row/column headers to eliminate strategies</span>
        <span>|</span>
        <span>Click payoff numbers to circle them</span>
        <button
          onClick={onResetMarkings}
          className="text-indigo-600 hover:text-indigo-800 font-medium underline"
        >
          Reset markings
        </button>
      </div>
    </div>
  );
}
