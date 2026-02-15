"use client";

import { DecisionNode, LeafNode, SequentialGame } from "@/lib/types";

interface DecisionTreeProps {
  game: SequentialGame;
  showSolution: boolean;
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

  // Parent x is the average of its children's x
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

export function DecisionTree({ game, showSolution }: DecisionTreeProps) {
  const leafCount = getLeafCount(game.tree);
  const leafSpacing = leafCount <= 4 ? 100 : 75;
  const totalWidth = Math.max(400, leafCount * leafSpacing + 60);
  const totalHeight = TOP_PADDING + 2 * LEVEL_HEIGHT + BOTTOM_PADDING;

  // Calculate evenly spaced leaf positions
  const startX = (totalWidth - (leafCount - 1) * leafSpacing) / 2;
  const leafPositions = Array.from(
    { length: leafCount },
    (_, i) => startX + i * leafSpacing
  );

  const root = layoutTree(game.tree, 0, leafPositions, { current: 0 });

  // Check if an edge is on the backward induction path
  const isOnPath = (parentLabel: string, edgeLabel: string, depth: number): boolean => {
    if (!showSolution) return false;
    if (depth === 0) {
      return game.backwardInductionPath[0] === edgeLabel;
    }
    if (depth === 1) {
      // Need to check if the parent edge matches path[0] and this edge matches path[1]
      return game.backwardInductionPath[1] === edgeLabel &&
        game.backwardInductionPath[0] === parentLabel;
    }
    return false;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
        Decision Tree
        <span className="ml-2 text-xs font-normal normal-case text-gray-400">
          (Player {game.firstMover} moves first)
        </span>
      </h2>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto block"
          style={{ maxWidth: `${totalWidth}px`, width: "100%" }}
        >
          {/* Render edges first (behind nodes) */}
          {renderEdges(root, "", 0, isOnPath)}

          {/* Render nodes on top */}
          {renderNodes(root, showSolution, game)}
        </svg>
      </div>

      {showSolution && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-indigo-500 rounded" />
            Backward induction path
          </span>
        </div>
      )}
    </div>
  );
}

function renderEdges(
  layout: LayoutNode,
  parentEdgeLabel: string,
  depth: number,
  isOnPath: (parentLabel: string, edgeLabel: string, depth: number) => boolean
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  for (const { edge, child } of layout.children) {
    const onPath = isOnPath(parentEdgeLabel, edge.label, depth);

    // Edge line
    elements.push(
      <line
        key={`edge-${layout.x}-${layout.y}-${child.x}-${child.y}`}
        x1={layout.x}
        y1={layout.y + NODE_RADIUS}
        x2={child.x}
        y2={child.y - (isLeaf(child.node) ? LEAF_RY : NODE_RADIUS)}
        stroke={onPath ? "#6366f1" : "#d1d5db"}
        strokeWidth={onPath ? 3 : 1.5}
        strokeLinecap="round"
      />
    );

    // Edge label (strategy name)
    const midX = (layout.x + child.x) / 2;
    const midY = (layout.y + child.y) / 2;
    const offsetX = child.x > layout.x ? -12 : child.x < layout.x ? 12 : 0;

    elements.push(
      <g key={`elabel-${layout.x}-${child.x}-${edge.label}`}>
        <rect
          x={midX + offsetX - 20}
          y={midY - 10}
          width="40"
          height="18"
          rx="4"
          fill="white"
          stroke={onPath ? "#6366f1" : "#e5e7eb"}
          strokeWidth="1"
        />
        <text
          x={midX + offsetX}
          y={midY + 2}
          textAnchor="middle"
          className="text-[11px] font-medium"
          fill={onPath ? "#4f46e5" : "#6b7280"}
        >
          {edge.label}
        </text>
      </g>
    );

    // Recurse into children
    elements.push(
      ...renderEdges(child, edge.label, depth + 1, isOnPath)
    );
  }

  return elements;
}

function renderNodes(
  layout: LayoutNode,
  showSolution: boolean,
  game: SequentialGame
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  if (isLeaf(layout.node)) {
    const leaf = layout.node as LeafNode;
    const isOutcome =
      showSolution &&
      leaf.id === `leaf-${game.backwardInductionOutcome.row}-${game.backwardInductionOutcome.col}`;

    // Leaf node: rounded rectangle with payoffs
    elements.push(
      <g key={`leaf-${layout.x}-${layout.y}`}>
        <rect
          x={layout.x - LEAF_RX}
          y={layout.y - LEAF_RY}
          width={LEAF_RX * 2}
          height={LEAF_RY * 2}
          rx="8"
          fill={isOutcome ? "#eef2ff" : "white"}
          stroke={isOutcome ? "#6366f1" : "#d1d5db"}
          strokeWidth={isOutcome ? 2.5 : 1.5}
        />
        {/* Player A payoff */}
        <text
          x={layout.x - 9}
          y={layout.y + 4}
          textAnchor="middle"
          className="text-[12px] font-bold font-mono"
          fill="#2563eb"
        >
          {leaf.payoffs.a}
        </text>
        {/* Comma */}
        <text
          x={layout.x}
          y={layout.y + 4}
          textAnchor="middle"
          className="text-[12px]"
          fill="#9ca3af"
        >
          ,
        </text>
        {/* Player B payoff */}
        <text
          x={layout.x + 11}
          y={layout.y + 4}
          textAnchor="middle"
          className="text-[12px] font-bold font-mono"
          fill="#dc2626"
        >
          {leaf.payoffs.b}
        </text>
      </g>
    );
  } else {
    const dNode = layout.node as DecisionNode;
    const isPlayerA = dNode.player === "A";

    // Decision node: circle with player label
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

  // Recurse into children
  for (const { child } of layout.children) {
    elements.push(...renderNodes(child, showSolution, game));
  }

  return elements;
}
