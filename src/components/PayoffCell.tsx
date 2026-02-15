"use client";

import { CellCoord, Payoffs, PlayerLabel } from "@/lib/types";

interface PayoffCellProps {
  payoffs: Payoffs;
  coord: CellCoord;
  isEliminated: boolean;
  circledA: boolean;
  circledB: boolean;
  onCirclePayoff: (coord: CellCoord, player: PlayerLabel) => void;
}

export function PayoffCell({
  payoffs,
  coord,
  isEliminated,
  circledA,
  circledB,
  onCirclePayoff,
}: PayoffCellProps) {
  return (
    <div
      className={`relative w-24 h-24 transition-all duration-200 ${
        isEliminated ? "bg-gray-100 opacity-30" : "bg-white"
      }`}
    >
      {/* Player B payoff (top-right) */}
      <button
        onClick={() => onCirclePayoff(coord, "B")}
        disabled={isEliminated}
        className={`absolute top-1.5 right-2 z-10 w-9 h-9 flex items-center justify-center text-sm font-mono font-bold rounded-full transition-all duration-150 ${
          isEliminated
            ? "text-gray-400 cursor-default"
            : circledB
              ? "ring-2 ring-red-500 text-red-700 bg-red-50 shadow-sm"
              : "text-red-600 hover:bg-red-50 cursor-pointer"
        }`}
        title={isEliminated ? "" : "Click to circle Player B's payoff"}
      >
        {payoffs.b}
      </button>

      {/* Comma separator */}
      <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none ${isEliminated ? "opacity-50" : ""}`}>
        ,
      </span>

      {/* Player A payoff (bottom-left) */}
      <button
        onClick={() => onCirclePayoff(coord, "A")}
        disabled={isEliminated}
        className={`absolute bottom-1.5 left-2 z-10 w-9 h-9 flex items-center justify-center text-sm font-mono font-bold rounded-full transition-all duration-150 ${
          isEliminated
            ? "text-gray-400 cursor-default"
            : circledA
              ? "ring-2 ring-blue-500 text-blue-700 bg-blue-50 shadow-sm"
              : "text-blue-600 hover:bg-blue-50 cursor-pointer"
        }`}
        title={isEliminated ? "" : "Click to circle Player A's payoff"}
      >
        {payoffs.a}
      </button>
    </div>
  );
}
