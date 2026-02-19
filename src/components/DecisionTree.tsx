"use client";

import { useState, useMemo } from "react";
import {
  DecisionNode,
  LeafNode,
  Payoffs,
  PayoffMatrix,
  PlayerLabel,
  SequentialGame,
  TreeHighlightedEdge,
} from "@/lib/types";
import { shuffle } from "@/lib/utils";

interface DecisionTreeProps {
  game: SequentialGame;
  showSolution: boolean;
  highlightedEdges: TreeHighlightedEdge[];
  leafPayoffs: Record<string, Payoffs>;
  matrix: PayoffMatrix;
  onToggleEdge: (parentId: string, edgeLabel: string) => void;
  onAssignLeaf: (leafId: string, payoffs: Payoffs) => void;
  onClearLeaf: (leafId: string) => void;
  onResetTree: () => void;
  onSetFirstMover: (player: PlayerLabel) => void;
}

// Horizontal layout constants
const NODE_RADIUS = 20;
const LEAF_RX = 26;
const LEAF_RY = 16;
const LEVEL_WIDTH = 150; // horizontal spacing between levels
const LEFT_PADDING = 40;
const RIGHT_PADDING = 50;
const TOP_PADDING = 20;
const BOTTOM_PADDING = 20;

function isLeaf(node: DecisionNode | LeafNode): node is LeafNode {
  return "isTerminal" in node && node.isTerminal === true;
}

interface LayoutNode {
  x: number;
  y: number;
  node: DecisionNode | LeafNode;
  children: { edge: { label: string }; child: LayoutNode }[];
}

// Horizontal layout: x = depth (left to right), y = leaf spread (top to bottom)
function layoutTreeH(
  node: DecisionNode | LeafNode,
  depth: number,
  leafPositions: number[],
  leafIdx: { current: number }
): LayoutNode {
  if (isLeaf(node)) {
    const y = leafPositions[leafIdx.current];
    leafIdx.current++;
    return {
      x: LEFT_PADDING + depth * LEVEL_WIDTH,
      y,
      node,
      children: [],
    };
  }

  const children = (node as DecisionNode).children.map((edge) => {
    const childLayout = layoutTreeH(edge.child, depth + 1, leafPositions, leafIdx);
    return { edge: { label: edge.label }, child: childLayout };
  });

  const avgY = children.reduce((sum, c) => sum + c.child.y, 0) / children.length;

  return {
    x: LEFT_PADDING + depth * LEVEL_WIDTH,
    y: avgY,
    node,
    children,
  };
}

function getLeafCount(node: DecisionNode | LeafNode): number {
  if (isLeaf(node)) return 1;
  return (node as DecisionNode).children.reduce(
    (sum, edge) => sum + getLeafCount(edge.child),
    0
  );
}

function getNodeId(node: DecisionNode | LeafNode): string {
  if (isLeaf(node)) return node.id;
  return (node as DecisionNode).id;
}

export function DecisionTree({
  game,
  showSolution,
  highlightedEdges,
  leafPayoffs,
  matrix,
  onToggleEdge,
  onAssignLeaf,
  onClearLeaf,
  onResetTree,
  onSetFirstMover,
}: DecisionTreeProps) {
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);

  const leafCount = getLeafCount(game.tree);
  const leafSpacing = leafCount <= 4 ? 55 : 45;
  const totalHeight = Math.max(200, TOP_PADDING + leafCount * leafSpacing + BOTTOM_PADDING);
  const totalWidth = LEFT_PADDING + 2 * LEVEL_WIDTH + RIGHT_PADDING + LEAF_RX;

  // Leaf positions spread vertically
  const startY = TOP_PADDING + (totalHeight - TOP_PADDING - BOTTOM_PADDING - (leafCount - 1) * leafSpacing) / 2;
  const leafPositions = Array.from(
    { length: leafCount },
    (_, i) => startY + i * leafSpacing
  );

  const root = layoutTreeH(game.tree, 0, leafPositions, { current: 0 });

  const isOnSolutionPath = (parentLabel: string, edgeLabel: string, depth: number): boolean => {
    if (!showSolution) return false;
    if (depth === 0) return game.backwardInductionPath[0] === edgeLabel;
    if (depth === 1) {
      return game.backwardInductionPath[1] === edgeLabel &&
        game.backwardInductionPath[0] === parentLabel;
    }
    return false;
  };

  const isHighlighted = (parentId: string, edgeLabel: string): boolean => {
    return highlightedEdges.some(
      (e) => e.parentId === parentId && e.edgeLabel === edgeLabel
    );
  };

  const populatedCount = Object.keys(leafPayoffs).length;
  const allPopulated = populatedCount === leafCount;

  // Build cell options for the leaf assignment picker (randomized order)
  const cellOptions = useMemo(() => {
    const options: { label: string; payoffs: Payoffs }[] = [];
    for (let r = 0; r < matrix.rows; r++) {
      for (let c = 0; c < matrix.cols; c++) {
        options.push({
          label: `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`,
          payoffs: matrix.cells[r][c],
        });
      }
    }
    return shuffle(options);
  }, [matrix, game.firstMover]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
        Decision Tree
      </h2>

      {/* First-mover toggle */}
      {!showSolution && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xs text-gray-500">First mover:</span>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => onSetFirstMover("A")}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${
                game.firstMover === "A"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-blue-50"
              }`}
            >
              Player A
            </button>
            <button
              onClick={() => onSetFirstMover("B")}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${
                game.firstMover === "B"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-600 hover:bg-red-50"
              }`}
            >
              Player B
            </button>
          </div>
        </div>
      )}

      {showSolution && (
        <p className="text-xs text-gray-400 text-center mb-2">
          Player {game.firstMover} moves first
        </p>
      )}

      {!showSolution && (
        <p className="text-xs text-gray-400 text-center mb-2">
          Click edges to highlight your path. Click leaf nodes to assign payoffs.
        </p>
      )}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto block"
          style={{ maxWidth: `${totalWidth}px`, width: "100%" }}
        >
          {renderEdgesH(root, "", 0, isOnSolutionPath, isHighlighted, onToggleEdge)}
          {renderNodesH(root, showSolution, game, leafPayoffs, selectedLeaf, setSelectedLeaf)}
        </svg>
      </div>

      {/* Leaf assignment popup */}
      {selectedLeaf && !showSolution && (
        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs font-semibold text-indigo-700 mb-2">
            Assign payoffs to this leaf:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cellOptions.map((cell) => {
              const alreadyUsed = Object.entries(leafPayoffs).some(
                ([lid, p]) =>
                  lid !== selectedLeaf &&
                  p.a === cell.payoffs.a &&
                  p.b === cell.payoffs.b
              );
              return (
                <button
                  key={cell.label}
                  onClick={() => {
                    onAssignLeaf(selectedLeaf, cell.payoffs);
                    setSelectedLeaf(null);
                  }}
                  disabled={alreadyUsed}
                  className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                    alreadyUsed
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
                  }`}
                >
                  <span className="text-blue-600">{cell.payoffs.a}</span>
                  <span className="text-gray-400">,</span>
                  <span className="text-red-600">{cell.payoffs.b}</span>
                </button>
              );
            })}
            {leafPayoffs[selectedLeaf] && (
              <button
                onClick={() => {
                  onClearLeaf(selectedLeaf);
                  setSelectedLeaf(null);
                }}
                className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setSelectedLeaf(null)}
              className="px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status / Legend bar */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {showSolution && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-indigo-500 rounded" />
              Solution path
            </span>
          )}
          {highlightedEdges.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-emerald-500 rounded" />
              Your path
            </span>
          )}
          {!showSolution && (
            <span>
              Leaves filled: {populatedCount}/{leafCount}
              {allPopulated && " \u2713"}
            </span>
          )}
        </div>
        {!showSolution && (
          <button
            onClick={onResetTree}
            className="text-indigo-600 hover:text-indigo-800 font-medium underline"
          >
            Reset tree
          </button>
        )}
      </div>
    </div>
  );
}

// ── Horizontal edge rendering ────────────────────────────────────

function renderEdgesH(
  layout: LayoutNode,
  parentEdgeLabel: string,
  depth: number,
  isOnSolutionPath: (parentLabel: string, edgeLabel: string, depth: number) => boolean,
  isHighlighted: (parentId: string, edgeLabel: string) => boolean,
  onToggleEdge: (parentId: string, edgeLabel: string) => void
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const parentId = getNodeId(layout.node);

  for (const { edge, child } of layout.children) {
    const onPath = isOnSolutionPath(parentEdgeLabel, edge.label, depth);
    const highlighted = isHighlighted(parentId, edge.label);

    const strokeColor = onPath ? "#6366f1" : highlighted ? "#10b981" : "#d1d5db";
    const strokeW = onPath ? 3 : highlighted ? 2.5 : 1.5;

    // Horizontal edge: parent right side -> child left side
    const x1 = layout.x + NODE_RADIUS;
    const y1 = layout.y;
    const x2 = child.x - (isLeaf(child.node) ? LEAF_RX : NODE_RADIUS);
    const y2 = child.y;

    elements.push(
      <line
        key={`edge-${layout.x}-${layout.y}-${child.x}-${child.y}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      />
    );

    // Wider hit area
    elements.push(
      <line
        key={`edge-hit-${layout.x}-${layout.y}-${child.x}-${child.y}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth="12"
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      />
    );

    // Edge label (strategy name) — positioned along the edge
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // For depth-0 edges (Player 1), offset away from the line direction.
    // For depth>=1 edges (Player 2+), always place the label ABOVE the line
    // (perpendicular offset) to prevent overlap between sibling edge labels.
    let labelX = midX;
    let labelY = midY;
    let labelAnchor: "middle" | "start" | "end" = "middle";

    if (depth === 0) {
      // Player 1 edge: horizontal or near-horizontal, offset vertically
      const offsetY = child.y > layout.y ? -10 : child.y < layout.y ? 10 : -10;
      labelY = midY + offsetY;
    } else {
      // Player 2+ edge: diagonal line — compute perpendicular offset so label
      // always sits above (to the upper side of) the line.
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Perpendicular unit vector (rotated 90° counter-clockwise = (-dy, dx))
      // "Above" the line means in the direction of (-dy, dx) normalised
      const perpX = -dy / len;
      const perpY = dx / len;
      // Use perpX/perpY so the label is always on the same side (above) the line
      const offset = 14;
      labelX = midX + perpX * offset;
      labelY = midY + perpY * offset;
      // Anchor based on which side the label ends up
      labelAnchor = perpX > 0.2 ? "start" : perpX < -0.2 ? "end" : "middle";
    }

    elements.push(
      <g
        key={`elabel-${layout.x}-${child.x}-${edge.label}`}
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      >
        <rect
          x={labelX - 20}
          y={labelY - 9}
          width="40"
          height="18"
          rx="4"
          fill="white"
          stroke={onPath ? "#6366f1" : highlighted ? "#10b981" : "#e5e7eb"}
          strokeWidth="1"
        />
        <text
          x={labelX}
          y={labelY + 3}
          textAnchor="middle"
          className="text-[11px] font-medium"
          fill={onPath ? "#4f46e5" : highlighted ? "#059669" : "#6b7280"}
        >
          {edge.label}
        </text>
      </g>
    );

    elements.push(
      ...renderEdgesH(child, edge.label, depth + 1, isOnSolutionPath, isHighlighted, onToggleEdge)
    );
  }

  return elements;
}

// ── Horizontal node rendering ────────────────────────────────────

function renderNodesH(
  layout: LayoutNode,
  showSolution: boolean,
  game: SequentialGame,
  leafPayoffs: Record<string, Payoffs>,
  selectedLeaf: string | null,
  setSelectedLeaf: (id: string | null) => void
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  if (isLeaf(layout.node)) {
    const leaf = layout.node as LeafNode;
    const isOutcome =
      showSolution &&
      leaf.id === `leaf-${game.backwardInductionOutcome.row}-${game.backwardInductionOutcome.col}`;

    const studentPayoffs = leafPayoffs[leaf.id];
    const isSelected = selectedLeaf === leaf.id;
    const hasPayoffs = showSolution || !!studentPayoffs;
    const displayPayoffs = showSolution ? leaf.payoffs : studentPayoffs;

    const isCorrectAssignment =
      showSolution && studentPayoffs &&
      studentPayoffs.a === leaf.payoffs.a && studentPayoffs.b === leaf.payoffs.b;
    const isWrongAssignment =
      showSolution && studentPayoffs &&
      (studentPayoffs.a !== leaf.payoffs.a || studentPayoffs.b !== leaf.payoffs.b);

    let fillColor = "white";
    let strokeColor = "#d1d5db";
    let strokeW = 1.5;

    if (isOutcome) {
      fillColor = "#eef2ff"; strokeColor = "#6366f1"; strokeW = 2.5;
    } else if (isSelected) {
      fillColor = "#f0fdf4"; strokeColor = "#10b981"; strokeW = 2;
    } else if (isCorrectAssignment) {
      fillColor = "#f0fdf4"; strokeColor = "#22c55e"; strokeW = 2;
    } else if (isWrongAssignment) {
      fillColor = "#fef2f2"; strokeColor = "#ef4444"; strokeW = 2;
    } else if (studentPayoffs && !showSolution) {
      fillColor = "#f0fdf4"; strokeColor = "#86efac"; strokeW = 1.5;
    }

    elements.push(
      <g
        key={`leaf-${layout.x}-${layout.y}`}
        className={showSolution ? undefined : "cursor-pointer"}
        onClick={() => {
          if (!showSolution) setSelectedLeaf(isSelected ? null : leaf.id);
        }}
      >
        <rect
          x={layout.x - LEAF_RX} y={layout.y - LEAF_RY}
          width={LEAF_RX * 2} height={LEAF_RY * 2}
          rx="8"
          fill={fillColor} stroke={strokeColor} strokeWidth={strokeW}
        />
        {hasPayoffs && displayPayoffs ? (
          <>
            <text x={layout.x - 9} y={layout.y + 4} textAnchor="middle"
              className="text-[11px] font-bold font-mono" fill="#2563eb">
              {displayPayoffs.a}
            </text>
            <text x={layout.x} y={layout.y + 4} textAnchor="middle"
              className="text-[11px]" fill="#9ca3af">,</text>
            <text x={layout.x + 10} y={layout.y + 4} textAnchor="middle"
              className="text-[11px] font-bold font-mono" fill="#dc2626">
              {displayPayoffs.b}
            </text>
          </>
        ) : (
          <text x={layout.x} y={layout.y + 4} textAnchor="middle"
            className="text-[11px]" fill="#9ca3af">?</text>
        )}
      </g>
    );
  } else {
    const dNode = layout.node as DecisionNode;
    const isPlayerA = dNode.player === "A";

    elements.push(
      <g key={`node-${layout.x}-${layout.y}`}>
        <circle
          cx={layout.x} cy={layout.y} r={NODE_RADIUS}
          fill={isPlayerA ? "#eff6ff" : "#fef2f2"}
          stroke={isPlayerA ? "#3b82f6" : "#ef4444"}
          strokeWidth="2"
        />
        <text
          x={layout.x} y={layout.y + 5}
          textAnchor="middle"
          className="text-[13px] font-bold"
          fill={isPlayerA ? "#2563eb" : "#dc2626"}
        >
          {dNode.player}
        </text>
      </g>
    );
  }

  for (const { child } of layout.children) {
    elements.push(...renderNodesH(child, showSolution, game, leafPayoffs, selectedLeaf, setSelectedLeaf));
  }

  return elements;
}
