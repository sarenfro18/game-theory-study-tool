"use client";

import { useState } from "react";
import {
  DecisionNode,
  LeafNode,
  Payoffs,
  PayoffMatrix,
  SequentialGame,
  TreeHighlightedEdge,
} from "@/lib/types";

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
}

// Layout constants
const NODE_RADIUS = 22;
const LEAF_RX = 28;
const LEAF_RY = 18;
const LEVEL_HEIGHT = 120;
const TOP_PADDING = 50;
const BOTTOM_PADDING = 40;

function isLeaf(node: DecisionNode | LeafNode): node is LeafNode {
  return "isTerminal" in node && node.isTerminal === true;
}

interface LayoutNode {
  x: number;
  y: number;
  node: DecisionNode | LeafNode;
  children: { edge: { label: string }; child: LayoutNode }[];
}

function layoutTree(
  node: DecisionNode | LeafNode,
  depth: number,
  leafPositions: number[],
  leafIdx: { current: number }
): LayoutNode {
  if (isLeaf(node)) {
    const x = leafPositions[leafIdx.current];
    leafIdx.current++;
    return {
      x,
      y: TOP_PADDING + depth * LEVEL_HEIGHT,
      node,
      children: [],
    };
  }

  const children = (node as DecisionNode).children.map((edge) => {
    const childLayout = layoutTree(
      edge.child,
      depth + 1,
      leafPositions,
      leafIdx
    );
    return { edge: { label: edge.label }, child: childLayout };
  });

  const avgX =
    children.reduce((sum, c) => sum + c.child.x, 0) / children.length;

  return {
    x: avgX,
    y: TOP_PADDING + depth * LEVEL_HEIGHT,
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
}: DecisionTreeProps) {
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);

  const leafCount = getLeafCount(game.tree);
  const leafSpacing = leafCount <= 4 ? 100 : 75;
  const totalWidth = Math.max(400, leafCount * leafSpacing + 60);
  const totalHeight = TOP_PADDING + 2 * LEVEL_HEIGHT + BOTTOM_PADDING;

  const startX = (totalWidth - (leafCount - 1) * leafSpacing) / 2;
  const leafPositions = Array.from(
    { length: leafCount },
    (_, i) => startX + i * leafSpacing
  );

  const root = layoutTree(game.tree, 0, leafPositions, { current: 0 });

  // Check if an edge is on the backward induction path (shown after submission)
  const isOnSolutionPath = (parentLabel: string, edgeLabel: string, depth: number): boolean => {
    if (!showSolution) return false;
    if (depth === 0) {
      return game.backwardInductionPath[0] === edgeLabel;
    }
    if (depth === 1) {
      return game.backwardInductionPath[1] === edgeLabel &&
        game.backwardInductionPath[0] === parentLabel;
    }
    return false;
  };

  // Check if an edge is highlighted by the student
  const isHighlighted = (parentId: string, edgeLabel: string): boolean => {
    return highlightedEdges.some(
      (e) => e.parentId === parentId && e.edgeLabel === edgeLabel
    );
  };

  // Count how many leaves have been populated
  const populatedCount = Object.keys(leafPayoffs).length;
  const allPopulated = populatedCount === leafCount;

  // Build cell options for the leaf assignment picker
  const cellOptions: { label: string; payoffs: Payoffs }[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      cellOptions.push({
        label: `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`,
        payoffs: matrix.cells[r][c],
      });
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
        Decision Tree
        <span className="ml-2 text-xs font-normal normal-case text-gray-400">
          (Player {game.firstMover} moves first)
        </span>
      </h2>

      {/* Instructions */}
      {!showSolution && (
        <p className="text-xs text-gray-400 text-center mb-2">
          Click edges to highlight your predicted path. Click leaf nodes to assign payoffs from the matrix.
        </p>
      )}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto block"
          style={{ maxWidth: `${totalWidth}px`, width: "100%" }}
        >
          {/* Render edges first (behind nodes) */}
          {renderEdges(root, "", 0, isOnSolutionPath, isHighlighted, onToggleEdge)}

          {/* Render nodes on top */}
          {renderNodes(root, showSolution, game, leafPayoffs, selectedLeaf, setSelectedLeaf)}
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

function renderEdges(
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

    // Edge line (clickable)
    elements.push(
      <line
        key={`edge-${layout.x}-${layout.y}-${child.x}-${child.y}`}
        x1={layout.x}
        y1={layout.y + NODE_RADIUS}
        x2={child.x}
        y2={child.y - (isLeaf(child.node) ? LEAF_RY : NODE_RADIUS)}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      />
    );

    // Invisible wider hit area for easier clicking
    elements.push(
      <line
        key={`edge-hit-${layout.x}-${layout.y}-${child.x}-${child.y}`}
        x1={layout.x}
        y1={layout.y + NODE_RADIUS}
        x2={child.x}
        y2={child.y - (isLeaf(child.node) ? LEAF_RY : NODE_RADIUS)}
        stroke="transparent"
        strokeWidth="12"
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      />
    );

    // Edge label
    const midX = (layout.x + child.x) / 2;
    const midY = (layout.y + child.y) / 2;
    const offsetX = child.x > layout.x ? -12 : child.x < layout.x ? 12 : 0;

    elements.push(
      <g
        key={`elabel-${layout.x}-${child.x}-${edge.label}`}
        className="cursor-pointer"
        onClick={() => onToggleEdge(parentId, edge.label)}
      >
        <rect
          x={midX + offsetX - 20}
          y={midY - 10}
          width="40"
          height="18"
          rx="4"
          fill="white"
          stroke={onPath ? "#6366f1" : highlighted ? "#10b981" : "#e5e7eb"}
          strokeWidth="1"
        />
        <text
          x={midX + offsetX}
          y={midY + 2}
          textAnchor="middle"
          className="text-[11px] font-medium"
          fill={onPath ? "#4f46e5" : highlighted ? "#059669" : "#6b7280"}
        >
          {edge.label}
        </text>
      </g>
    );

    // Recurse
    elements.push(
      ...renderEdges(child, edge.label, depth + 1, isOnSolutionPath, isHighlighted, onToggleEdge)
    );
  }

  return elements;
}

function renderNodes(
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

    // Check if student has populated this leaf
    const studentPayoffs = leafPayoffs[leaf.id];
    const isSelected = selectedLeaf === leaf.id;
    const hasPayoffs = showSolution || !!studentPayoffs;

    const displayPayoffs = showSolution ? leaf.payoffs : studentPayoffs;

    // Check if student assignment matches the actual payoffs
    const isCorrectAssignment =
      showSolution &&
      studentPayoffs &&
      studentPayoffs.a === leaf.payoffs.a &&
      studentPayoffs.b === leaf.payoffs.b;
    const isWrongAssignment =
      showSolution &&
      studentPayoffs &&
      (studentPayoffs.a !== leaf.payoffs.a || studentPayoffs.b !== leaf.payoffs.b);

    let fillColor = "white";
    let strokeColor = "#d1d5db";
    let strokeW = 1.5;

    if (isOutcome) {
      fillColor = "#eef2ff";
      strokeColor = "#6366f1";
      strokeW = 2.5;
    } else if (isSelected) {
      fillColor = "#f0fdf4";
      strokeColor = "#10b981";
      strokeW = 2;
    } else if (isCorrectAssignment) {
      fillColor = "#f0fdf4";
      strokeColor = "#22c55e";
      strokeW = 2;
    } else if (isWrongAssignment) {
      fillColor = "#fef2f2";
      strokeColor = "#ef4444";
      strokeW = 2;
    } else if (studentPayoffs && !showSolution) {
      fillColor = "#f0fdf4";
      strokeColor = "#86efac";
      strokeW = 1.5;
    }

    elements.push(
      <g
        key={`leaf-${layout.x}-${layout.y}`}
        className={showSolution ? undefined : "cursor-pointer"}
        onClick={() => {
          if (!showSolution) {
            setSelectedLeaf(isSelected ? null : leaf.id);
          }
        }}
      >
        <rect
          x={layout.x - LEAF_RX}
          y={layout.y - LEAF_RY}
          width={LEAF_RX * 2}
          height={LEAF_RY * 2}
          rx="8"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {hasPayoffs && displayPayoffs ? (
          <>
            <text
              x={layout.x - 9}
              y={layout.y + 4}
              textAnchor="middle"
              className="text-[12px] font-bold font-mono"
              fill="#2563eb"
            >
              {displayPayoffs.a}
            </text>
            <text
              x={layout.x}
              y={layout.y + 4}
              textAnchor="middle"
              className="text-[12px]"
              fill="#9ca3af"
            >
              ,
            </text>
            <text
              x={layout.x + 11}
              y={layout.y + 4}
              textAnchor="middle"
              className="text-[12px] font-bold font-mono"
              fill="#dc2626"
            >
              {displayPayoffs.b}
            </text>
          </>
        ) : (
          <text
            x={layout.x}
            y={layout.y + 4}
            textAnchor="middle"
            className="text-[11px]"
            fill="#9ca3af"
          >
            ?
          </text>
        )}
      </g>
    );
  } else {
    const dNode = layout.node as DecisionNode;
    const isPlayerA = dNode.player === "A";

    elements.push(
      <g key={`node-${layout.x}-${layout.y}`}>
        <circle
          cx={layout.x}
          cy={layout.y}
          r={NODE_RADIUS}
          fill={isPlayerA ? "#eff6ff" : "#fef2f2"}
          stroke={isPlayerA ? "#3b82f6" : "#ef4444"}
          strokeWidth="2"
        />
        <text
          x={layout.x}
          y={layout.y + 5}
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
    elements.push(...renderNodes(child, showSolution, game, leafPayoffs, selectedLeaf, setSelectedLeaf));
  }

  return elements;
}
