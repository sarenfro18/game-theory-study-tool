import {
  DecisionEdge,
  DecisionNode,
  LeafNode,
  PayoffMatrix,
  PlayerLabel,
  SequentialGame,
} from "./types";

export function buildSequentialGame(
  matrix: PayoffMatrix,
  firstMover: PlayerLabel
): SequentialGame {
  const tree = buildDecisionTree(matrix, firstMover);
  const { path, outcome } = solveBackwardInduction(tree, matrix);

  // Find the cell coordinates from the outcome leaf
  const outcomeCoord = findLeafCoord(matrix, outcome);

  return {
    matrix,
    tree,
    firstMover,
    backwardInductionPath: path,
    backwardInductionOutcome: outcomeCoord,
  };
}

function buildDecisionTree(
  matrix: PayoffMatrix,
  firstMover: PlayerLabel
): DecisionNode {
  const secondMover: PlayerLabel = firstMover === "A" ? "B" : "A";

  // First mover chooses their strategies
  const firstStrategies =
    firstMover === "A" ? matrix.rowLabels : matrix.colLabels;
  const secondStrategies =
    secondMover === "A" ? matrix.rowLabels : matrix.colLabels;

  const children: DecisionEdge[] = firstStrategies.map(
    (firstLabel, firstIdx) => {
      // Second mover responds to first mover's choice
      const secondChildren: DecisionEdge[] = secondStrategies.map(
        (secondLabel, secondIdx) => {
          const row = firstMover === "A" ? firstIdx : secondIdx;
          const col = firstMover === "A" ? secondIdx : firstIdx;

          const leaf: LeafNode = {
            id: `leaf-${row}-${col}`,
            payoffs: matrix.cells[row][col],
            isTerminal: true,
          };

          return {
            label: secondLabel,
            child: leaf,
          };
        }
      );

      const secondNode: DecisionNode = {
        id: `${secondMover}-after-${firstLabel}`,
        player: secondMover,
        label: secondMover,
        children: secondChildren,
      };

      return {
        label: firstLabel,
        child: secondNode,
      };
    }
  );

  return {
    id: "root",
    player: firstMover,
    label: firstMover,
    children,
  };
}

interface BackwardInductionResult {
  path: string[];
  outcome: LeafNode;
}

function solveBackwardInduction(
  node: DecisionNode,
  matrix: PayoffMatrix
): BackwardInductionResult {
  // Recursively solve from leaves upward
  const results = node.children.map((edge) => {
    if (isLeaf(edge.child)) {
      return {
        edge,
        leaf: edge.child,
        payoffs: edge.child.payoffs,
      };
    }
    // Recurse into child decision node
    const childResult = solveBackwardInduction(
      edge.child as DecisionNode,
      matrix
    );
    return {
      edge,
      leaf: childResult.outcome,
      payoffs: childResult.outcome.payoffs,
    };
  });

  // The current player picks the edge with the best payoff for themselves
  let bestIdx = 0;
  let bestPayoff = -Infinity;
  for (let i = 0; i < results.length; i++) {
    const relevantPayoff =
      node.player === "A"
        ? results[i].payoffs.a
        : results[i].payoffs.b;
    if (relevantPayoff > bestPayoff) {
      bestPayoff = relevantPayoff;
      bestIdx = i;
    }
  }

  const chosen = results[bestIdx];

  // Build path
  const path = [chosen.edge.label];
  if (!isLeaf(chosen.edge.child)) {
    const childResult = solveBackwardInduction(
      chosen.edge.child as DecisionNode,
      matrix
    );
    path.push(...childResult.path);
  }

  return {
    path,
    outcome: chosen.leaf,
  };
}

function isLeaf(node: DecisionNode | LeafNode): node is LeafNode {
  return "isTerminal" in node && node.isTerminal === true;
}

function findLeafCoord(
  matrix: PayoffMatrix,
  leaf: LeafNode
): { row: number; col: number } {
  // Parse from leaf id: "leaf-{row}-{col}"
  const parts = leaf.id.split("-");
  return {
    row: parseInt(parts[1], 10),
    col: parseInt(parts[2], 10),
  };
}
