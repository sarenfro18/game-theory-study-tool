import {
  Difficulty,
  PayoffMatrix,
  Question,
  QuestionCategory,
  SequentialGame,
} from "./types";
import { findDominatedStrategies } from "./dominated";
import { performIEDS } from "./ieds";
import { findNashEquilibria } from "./nash";
import { buildSequentialGame } from "./sequential";
import { formatPayoffs, generateId, shuffle } from "./utils";

const EASY_CATEGORIES: QuestionCategory[] = [
  "find_dominated_strategies",
  "ieds_survivors",
  "nash_equilibrium",
  "residual_game",
  "count_nash",
];

const MEDIUM_CATEGORIES: QuestionCategory[] = [
  ...EASY_CATEGORIES,
  "select_all_nash",
  "true_false",
  "willingness_to_pay",
];

const HARD_CATEGORIES: QuestionCategory[] = [
  // Weighted toward outcome questions (commonly tested on exams)
  "sequential_first_mover",
  "sequential_first_mover",
  "sequential_second_mover",
  "sequential_second_mover",
  "sequential_best_response",
  "consulting_offer",
];

function getCategoriesForDifficulty(difficulty: Difficulty): QuestionCategory[] {
  if (difficulty === "easy") return EASY_CATEGORIES;
  if (difficulty === "medium") return MEDIUM_CATEGORIES;
  return HARD_CATEGORIES;
}

export function generateQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  const categories = getCategoriesForDifficulty(difficulty);
  const category = categories[Math.floor(Math.random() * categories.length)];
  return generateQuestionForCategory(matrix, category, difficulty, sequentialGame);
}

function generateQuestionForCategory(
  matrix: PayoffMatrix,
  category: QuestionCategory,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  switch (category) {
    case "find_dominated_strategies":
      return generateDominatedQuestion(matrix, difficulty);
    case "ieds_survivors":
      return generateIEDSQuestion(matrix, difficulty);
    case "nash_equilibrium":
      return generateNashQuestion(matrix, difficulty);
    case "select_all_nash":
      return generateSelectAllNashQuestion(matrix, difficulty);
    case "residual_game":
      return generateResidualGameQuestion(matrix, difficulty);
    case "count_nash":
      return generateCountNashQuestion(matrix, difficulty);
    case "true_false":
      return generateTrueFalseQuestion(matrix, difficulty);
    case "willingness_to_pay":
      return generateWillingnessToPayQuestion(matrix, difficulty);
    case "sequential_first_mover":
      return generateSequentialFirstMoverQuestion(matrix, difficulty, sequentialGame);
    case "sequential_second_mover":
      return generateSequentialSecondMoverQuestion(matrix, difficulty, sequentialGame);
    case "sequential_best_response":
      return generateSequentialBestResponseQuestion(matrix, difficulty, sequentialGame);
    case "consulting_offer":
      return generateConsultingOfferQuestion(matrix, difficulty, sequentialGame);
    default:
      return generateNashQuestion(matrix, difficulty);
  }
}

// ── Easy Questions ──────────────────────────────────────────────

function generateDominatedQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const dominated = findDominatedStrategies(matrix);
  const strictlyDominated = dominated.filter((d) => d.strict);

  let correctAnswer: string;
  if (strictlyDominated.length === 0) {
    correctAnswer = "None of the Above";
  } else {
    const labels = [
      ...new Set(
        strictlyDominated.map(
          (d) => `${d.dominated.label} (Player ${d.dominated.player})`
        )
      ),
    ];
    labels.sort();
    correctAnswer = labels.join(", ");
  }

  const allStrategies: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    allStrategies.push(`${matrix.rowLabels[r]} (Player A)`);
  }
  for (let c = 0; c < matrix.cols; c++) {
    allStrategies.push(`${matrix.colLabels[c]} (Player B)`);
  }

  const distractors = allStrategies.filter((s) => !correctAnswer.includes(s));
  const options = buildOptions(correctAnswer, distractors, allStrategies);
  const explanation = buildDominatedExplanation(matrix, strictlyDominated);

  return {
    id: generateId(),
    category: "find_dominated_strategies",
    difficulty,
    text: "Find all strictly dominated strategies in this game. Consider only the original game; do not look for dominated strategies after deleting any.",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateIEDSQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const ieds = performIEDS(matrix);
  const survivors = ieds.survivingCells;

  let correctAnswer: string;
  if (survivors.length === 0) {
    correctAnswer = "None of the Above";
  } else {
    const labels = survivors
      .map((s) => `(${matrix.rowLabels[s.row]}, ${matrix.colLabels[s.col]})`)
      .sort();
    correctAnswer = labels.join(", ");
  }

  const allCells: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      allCells.push(`(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`);
    }
  }

  const distractors = allCells.filter((cell) => !correctAnswer.includes(cell));
  const options = buildOptions(correctAnswer, distractors, allCells);

  const stepsExplanation =
    ieds.steps.length > 0
      ? ieds.steps.map((s, i) => `Step ${i + 1}: ${s.reason}`).join("\n")
      : "No strategies can be eliminated through IEDS.";

  return {
    id: generateId(),
    category: "ieds_survivors",
    difficulty,
    text: "What outcomes survive the iterated elimination of strictly dominated strategies (IEDS)?",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation: `${stepsExplanation}\n\nThe surviving outcomes are: ${correctAnswer}.`,
  };
}

function generateNashQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const nash = findNashEquilibria(matrix);

  let correctAnswer: string;
  if (nash.length === 0) {
    correctAnswer = "None of the Above";
  } else {
    const labels = nash
      .map((ne) => `(${ne.rowLabel}, ${ne.colLabel})`)
      .sort();
    correctAnswer = labels.join(", ");
  }

  const allCells: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      allCells.push(`(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`);
    }
  }

  const distractors = allCells.filter((cell) => !correctAnswer.includes(cell));
  const options = buildOptions(correctAnswer, distractors, allCells);
  const explanation = buildNashExplanation(matrix, nash);

  return {
    id: generateId(),
    category: "nash_equilibrium",
    difficulty,
    text: "What is/are the Nash Equilibrium/equilibria of this game?",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateResidualGameQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const ieds = performIEDS(matrix);
  const residual = ieds.residualMatrix;

  let correctAnswer: string;
  if (
    !residual ||
    (residual.rows === matrix.rows && residual.cols === matrix.cols)
  ) {
    correctAnswer = "The full original game (no strategies eliminated)";
  } else {
    const rowStr = residual.rowLabels.join(", ");
    const colStr = residual.colLabels.join(", ");
    correctAnswer = `${residual.rows}x${residual.cols} game: {${rowStr}} vs {${colStr}}`;
  }

  const distractors: string[] = [];
  if (matrix.rows === 3 && matrix.cols === 3) {
    const combos = [
      { rows: [0, 1], cols: [0, 1] },
      { rows: [0, 2], cols: [0, 2] },
      { rows: [1, 2], cols: [1, 2] },
      { rows: [0], cols: [0, 1, 2] },
      { rows: [0, 1, 2], cols: [0] },
    ];
    for (const combo of combos) {
      const rLabels = combo.rows.map((r) => matrix.rowLabels[r]).join(", ");
      const cLabels = combo.cols.map((c) => matrix.colLabels[c]).join(", ");
      const desc = `${combo.rows.length}x${combo.cols.length} game: {${rLabels}} vs {${cLabels}}`;
      if (desc !== correctAnswer) distractors.push(desc);
    }
  } else {
    distractors.push(
      `1x1 game: {${matrix.rowLabels[0]}} vs {${matrix.colLabels[0]}}`,
      `1x1 game: {${matrix.rowLabels[1]}} vs {${matrix.colLabels[1]}}`,
      `1x2 game: {${matrix.rowLabels[0]}} vs {${matrix.colLabels.join(", ")}}`,
      `2x1 game: {${matrix.rowLabels.join(", ")}} vs {${matrix.colLabels[0]}}`
    );
  }

  const filtered = distractors.filter((d) => d !== correctAnswer);
  const options = buildOptions(correctAnswer, filtered, filtered);

  const stepsExplanation =
    ieds.steps.length > 0
      ? ieds.steps.map((s, i) => `Step ${i + 1}: ${s.reason}`).join("\n")
      : "No strategies can be eliminated.";

  return {
    id: generateId(),
    category: "residual_game",
    difficulty,
    text: "What is the residual game that remains after iteratively eliminating strictly dominated strategies?",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation: `${stepsExplanation}\n\nThe residual game is: ${correctAnswer}.`,
  };
}

function generateCountNashQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const nash = findNashEquilibria(matrix);
  const count = nash.length;
  const correctAnswer = count.toString();

  const distractors = ["0", "1", "2", "3", "4"].filter(
    (d) => d !== correctAnswer
  );
  const options = buildOptions(correctAnswer, distractors, distractors);
  const explanation = buildNashExplanation(matrix, nash);

  return {
    id: generateId(),
    category: "count_nash",
    difficulty,
    text: "How many pure-strategy Nash Equilibria exist in this game?",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation: `There ${count === 1 ? "is" : "are"} ${count} pure-strategy Nash ${count === 1 ? "Equilibrium" : "Equilibria"}.\n\n${explanation}`,
  };
}

function generateSelectAllNashQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const nash = findNashEquilibria(matrix);

  // Build all cell options
  const allCellOptions: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      allCellOptions.push(`(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`);
    }
  }

  // Add "No Nash Equilibrium exists" as the last option
  const options = [...allCellOptions, "No Nash Equilibrium exists"];

  // Find correct indices
  let correctIndices: number[];
  if (nash.length === 0) {
    correctIndices = [options.length - 1]; // "No Nash Equilibrium exists"
  } else {
    correctIndices = nash.map((ne) => {
      const label = `(${ne.rowLabel}, ${ne.colLabel})`;
      return options.indexOf(label);
    });
  }

  const explanation = buildNashExplanation(matrix, nash);

  return {
    id: generateId(),
    category: "select_all_nash",
    difficulty,
    text: "Select ALL outcomes that are Nash Equilibria in this game.",
    options,
    correctIndex: correctIndices[0],
    correctIndices,
    multiSelect: true,
    explanation,
  };
}

// ── Medium Questions ────────────────────────────────────────────

function generateTrueFalseQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const dominated = findDominatedStrategies(matrix);
  const nash = findNashEquilibria(matrix);

  const statementTypes = ["dominated_claim", "nash_claim", "payoff_comparison"];
  const type = statementTypes[Math.floor(Math.random() * statementTypes.length)];

  let statement: string;
  let isTrue: boolean;
  let explanation: string;

  if (type === "dominated_claim" && matrix.rows >= 2) {
    const r = Math.floor(Math.random() * matrix.rows);
    const otherR = (r + 1) % matrix.rows;
    const actuallyDominated = dominated.some(
      (d) =>
        d.dominated.player === "A" &&
        d.dominated.index === r &&
        d.by.index === otherR &&
        d.strict
    );
    statement = `"${matrix.rowLabels[r]}" is strictly dominated by "${matrix.rowLabels[otherR]}" for Player A.`;
    isTrue = actuallyDominated;

    const comparisons = Array.from({ length: matrix.cols }, (_, c) => {
      const payoffR = matrix.cells[r][c].a;
      const payoffOther = matrix.cells[otherR][c].a;
      return `${matrix.colLabels[c]}: ${payoffOther} ${payoffOther > payoffR ? ">" : payoffOther === payoffR ? "=" : "<"} ${payoffR}`;
    });
    explanation = isTrue
      ? `TRUE. Comparing Player A's payoffs column by column — ${comparisons.join("; ")}. "${matrix.rowLabels[otherR]}" gives strictly higher payoffs in every column.`
      : `FALSE. Comparing Player A's payoffs column by column — ${comparisons.join("; ")}. "${matrix.rowLabels[otherR]}" does NOT give strictly higher payoffs in every column.`;
  } else if (type === "nash_claim") {
    const r = Math.floor(Math.random() * matrix.rows);
    const c = Math.floor(Math.random() * matrix.cols);
    const isNash = nash.some((ne) => ne.row === r && ne.col === c);
    statement = `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]}) is a Nash Equilibrium.`;
    isTrue = isNash;

    const cell = matrix.cells[r][c];
    let bestAInCol = -Infinity;
    for (let r2 = 0; r2 < matrix.rows; r2++) {
      bestAInCol = Math.max(bestAInCol, matrix.cells[r2][c].a);
    }
    let bestBInRow = -Infinity;
    for (let c2 = 0; c2 < matrix.cols; c2++) {
      bestBInRow = Math.max(bestBInRow, matrix.cells[r][c2].b);
    }
    const aBest = cell.a >= bestAInCol;
    const bBest = cell.b >= bestBInRow;

    if (isTrue) {
      explanation = `TRUE. Player A's payoff of ${cell.a} is the best response in column ${matrix.colLabels[c]} (max is ${bestAInCol}), and Player B's payoff of ${cell.b} is the best response in row ${matrix.rowLabels[r]} (max is ${bestBInRow}). Neither player can improve by deviating.`;
    } else {
      const reasons: string[] = [];
      if (!aBest)
        reasons.push(
          `Player A gets ${cell.a} but could get ${bestAInCol} by switching rows`
        );
      if (!bBest)
        reasons.push(
          `Player B gets ${cell.b} but could get ${bestBInRow} by switching columns`
        );
      explanation = `FALSE. ${reasons.join(". Also, ")}. At least one player can improve by deviating.`;
    }
  } else {
    const r = Math.floor(Math.random() * matrix.rows);
    const c = Math.floor(Math.random() * matrix.cols);
    const payoffs = matrix.cells[r][c];
    isTrue = payoffs.a > payoffs.b;
    statement = `At (${matrix.rowLabels[r]}, ${matrix.colLabels[c]}), Player A's payoff is greater than Player B's payoff.`;
    explanation = `Player A's payoff is ${payoffs.a} and Player B's payoff is ${payoffs.b} at (${matrix.rowLabels[r]}, ${matrix.colLabels[c]}). Since ${payoffs.a} ${isTrue ? ">" : payoffs.a === payoffs.b ? "=" : "<"} ${payoffs.b}, the statement is ${isTrue ? "TRUE" : "FALSE"}.`;
  }

  const correctAnswer = isTrue ? "True" : "False";
  const options = [
    "True",
    "False",
    "Cannot be determined from the given information",
    "Only true if the game is repeated",
    "None of the Above",
  ];

  return {
    id: generateId(),
    category: "true_false",
    difficulty,
    text: `True or False: ${statement}`,
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateWillingnessToPayQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty
): Question {
  const nash = findNashEquilibria(matrix);

  // If no NE, fall back to a different question
  if (nash.length === 0) {
    return generateNashQuestion(matrix, difficulty);
  }

  const ne = nash[0];

  // Pick a column that is NOT the NE column to "prohibit"
  const otherCols = Array.from({ length: matrix.cols }, (_, i) => i).filter(
    (c) => c !== ne.col
  );
  if (otherCols.length === 0) {
    return generateNashQuestion(matrix, difficulty);
  }

  // Pick the NE column as the one to prohibit
  // Scenario: "What would Player A pay to prohibit Player B from choosing [NE column]?"
  // or prohibit a non-NE column
  const prohibitCol = Math.random() < 0.5 ? ne.col : otherCols[0];
  const prohibitLabel = matrix.colLabels[prohibitCol];

  // Find NE payoff for A in original game
  const originalPayoffA = ne.payoffs.a;

  // Find what happens without the prohibited column
  const remainingCols = Array.from({ length: matrix.cols }, (_, i) => i).filter(
    (c) => c !== prohibitCol
  );

  if (remainingCols.length === 0) {
    return generateNashQuestion(matrix, difficulty);
  }

  // Find best outcome for A in the reduced game
  // Simple approach: find the NE of the reduced game
  let bestPayoffAReduced = -Infinity;
  let reducedOutcome = "";
  for (const r of Array.from({ length: matrix.rows }, (_, i) => i)) {
    for (const c of remainingCols) {
      // Check if this is a NE in the reduced game
      let isBestForA = true;
      for (let r2 = 0; r2 < matrix.rows; r2++) {
        if (matrix.cells[r2][c].a > matrix.cells[r][c].a) {
          isBestForA = false;
          break;
        }
      }
      let isBestForB = true;
      for (const c2 of remainingCols) {
        if (matrix.cells[r][c2].b > matrix.cells[r][c].b) {
          isBestForB = false;
          break;
        }
      }
      if (isBestForA && isBestForB && matrix.cells[r][c].a > bestPayoffAReduced) {
        bestPayoffAReduced = matrix.cells[r][c].a;
        reducedOutcome = `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`;
      }
    }
  }

  // If no NE found in reduced game, use best payoff across all remaining cells
  if (bestPayoffAReduced === -Infinity) {
    for (const r of Array.from({ length: matrix.rows }, (_, i) => i)) {
      for (const c of remainingCols) {
        if (matrix.cells[r][c].a > bestPayoffAReduced) {
          bestPayoffAReduced = matrix.cells[r][c].a;
          reducedOutcome = `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]})`;
        }
      }
    }
  }

  const wtp = Math.max(0, bestPayoffAReduced - originalPayoffA);
  const correctAnswer = wtp.toString();

  // Generate distractors: nearby values
  const distractorValues = new Set<string>();
  for (let delta = -3; delta <= 3; delta++) {
    const val = wtp + delta;
    if (val >= 0 && val.toString() !== correctAnswer) {
      distractorValues.add(val.toString());
    }
  }
  // Add some payoff values from the matrix as distractors
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      const val = Math.abs(matrix.cells[r][c].a);
      if (val.toString() !== correctAnswer) {
        distractorValues.add(val.toString());
      }
    }
  }

  const distractors = shuffle([...distractorValues]);
  const options = buildOptions(correctAnswer, distractors, distractors);

  const explanation =
    `In the original game, the Nash Equilibrium is at (${ne.rowLabel}, ${ne.colLabel}) where Player A gets ${originalPayoffA}.\n\n` +
    `If "${prohibitLabel}" is prohibited, the game reduces and the best outcome for Player A becomes ${reducedOutcome} with a payoff of ${bestPayoffAReduced}.\n\n` +
    `Player A's willingness to pay = ${bestPayoffAReduced} - ${originalPayoffA} = ${bestPayoffAReduced - originalPayoffA}.` +
    (wtp === 0
      ? `\nSince this is ${bestPayoffAReduced - originalPayoffA <= 0 ? "not positive" : "zero"}, Player A would not pay anything (WTP = 0).`
      : `\nPlayer A would pay up to ${wtp} to prohibit "${prohibitLabel}".`);

  return {
    id: generateId(),
    category: "willingness_to_pay",
    difficulty,
    text: `Both players can choose any strategy. What is the highest amount Player A would be willing to pay to prohibit Player B from choosing "${prohibitLabel}"?`,
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

// ── Hard Questions (Sequential Games) ───────────────────────────

function generateSequentialFirstMoverQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  // Build a game where Player A moves first if we don't have one
  const game =
    sequentialGame && sequentialGame.firstMover === "A"
      ? sequentialGame
      : buildSequentialGame(matrix, "A");

  const outcomeRow = game.backwardInductionOutcome.row;
  const outcomeCol = game.backwardInductionOutcome.col;
  const outcomePayoffs = matrix.cells[outcomeRow][outcomeCol];
  const correctAnswer = `(${matrix.rowLabels[outcomeRow]}, ${matrix.colLabels[outcomeCol]}) with payoffs ${formatPayoffs(outcomePayoffs)}`;

  // Distractors: other cell outcomes
  const allOutcomes: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      const label = `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]}) with payoffs ${formatPayoffs(matrix.cells[r][c])}`;
      allOutcomes.push(label);
    }
  }

  const distractors = allOutcomes.filter((o) => o !== correctAnswer);
  const options = buildOptions(correctAnswer, distractors, allOutcomes);

  // Build step-by-step backward induction explanation
  const explanation = buildBackwardInductionExplanation(matrix, game);

  return {
    id: generateId(),
    category: "sequential_first_mover",
    difficulty,
    text: "Suppose Player A has a head start and can make the first move. Using backward induction, what is the equilibrium outcome?",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateSequentialSecondMoverQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  // Build a game where Player B moves first
  const game =
    sequentialGame && sequentialGame.firstMover === "B"
      ? sequentialGame
      : buildSequentialGame(matrix, "B");

  const outcomeRow = game.backwardInductionOutcome.row;
  const outcomeCol = game.backwardInductionOutcome.col;
  const outcomePayoffs = matrix.cells[outcomeRow][outcomeCol];
  const correctAnswer = `(${matrix.rowLabels[outcomeRow]}, ${matrix.colLabels[outcomeCol]}) with payoffs ${formatPayoffs(outcomePayoffs)}`;

  const allOutcomes: string[] = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      allOutcomes.push(
        `(${matrix.rowLabels[r]}, ${matrix.colLabels[c]}) with payoffs ${formatPayoffs(matrix.cells[r][c])}`
      );
    }
  }

  const distractors = allOutcomes.filter((o) => o !== correctAnswer);
  const options = buildOptions(correctAnswer, distractors, allOutcomes);
  const explanation = buildBackwardInductionExplanation(matrix, game);

  return {
    id: generateId(),
    category: "sequential_second_mover",
    difficulty,
    text: "What will be the outcome if Player B has the head start and can make the first move? Use backward induction.",
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateSequentialBestResponseQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  // Randomly pick which player we ask about and who moves first
  const askAbout: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
  const firstMover: "A" | "B" = askAbout === "A" ? "B" : "A";

  // Build a game where the OTHER player moves first
  const game =
    sequentialGame && sequentialGame.firstMover === firstMover
      ? sequentialGame
      : buildSequentialGame(matrix, firstMover);

  // The backward induction path tells us what happens:
  // path[0] = first mover's choice, path[1] = second mover's (askAbout's) best response
  const bestResponseLabel = game.backwardInductionPath[1];
  const correctAnswer = bestResponseLabel;

  // Distractors: other strategies for the asked-about player
  const askAboutStrategies = askAbout === "A" ? matrix.rowLabels : matrix.colLabels;
  const distractors = askAboutStrategies.filter((s) => s !== correctAnswer);

  // Build options
  const shuffled = shuffle(distractors);
  const options = shuffle([correctAnswer, ...shuffled.slice(0, 3)]);
  if (options.length < 4) {
    options.push("None of the Above");
  }

  const explanation = buildBackwardInductionExplanation(matrix, game);

  return {
    id: generateId(),
    category: "sequential_best_response",
    difficulty,
    text: `If Player ${firstMover} moves first, what move should Player ${askAbout} make in response using backward induction?`,
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function generateConsultingOfferQuestion(
  matrix: PayoffMatrix,
  difficulty: Difficulty,
  sequentialGame?: SequentialGame
): Question {
  // Compare outcomes when A moves first vs B moves first
  const gameA = buildSequentialGame(matrix, "A");
  const gameB = buildSequentialGame(matrix, "B");

  const outcomeA = matrix.cells[gameA.backwardInductionOutcome.row][gameA.backwardInductionOutcome.col];
  const outcomeB = matrix.cells[gameB.backwardInductionOutcome.row][gameB.backwardInductionOutcome.col];

  // "You can help either player move first. Which offer gives YOU (the consultant) the highest profit?"
  // The player who benefits more from moving first would pay more for your services.
  // Player A's gain from moving first = outcomeA.a - (simultaneous NE payoff for A)
  // Player B's gain from moving first = outcomeB.b - (simultaneous NE payoff for B)

  const nash = findNashEquilibria(matrix);
  const simultaneousA = nash.length > 0 ? nash[0].payoffs.a : 0;
  const simultaneousB = nash.length > 0 ? nash[0].payoffs.b : 0;

  const gainA = outcomeA.a - simultaneousA;
  const gainB = outcomeB.b - simultaneousB;

  // The consultant charges up to what each player would pay
  // Best offer: whichever player gains more from going first
  interface Offer {
    description: string;
    profit: number;
  }
  const offers: Offer[] = [
    {
      description: `Help Player A move first, charging ${Math.max(0, gainA)}`,
      profit: Math.max(0, gainA),
    },
    {
      description: `Help Player B move first, charging ${Math.max(0, gainB)}`,
      profit: Math.max(0, gainB),
    },
    {
      description: `Help neither player (profit = 0)`,
      profit: 0,
    },
  ];

  // Add a distractor offer
  const fakeProfit = Math.max(0, Math.abs(gainA - gainB));
  if (fakeProfit !== offers[0].profit && fakeProfit !== offers[1].profit) {
    offers.push({
      description: `Help both players simultaneously, charging ${fakeProfit}`,
      profit: fakeProfit,
    });
  }

  // Find the best offer
  let bestOffer = offers[0];
  for (const offer of offers) {
    if (offer.profit > bestOffer.profit) bestOffer = offer;
  }

  const correctAnswer = bestOffer.description;
  const distractors = offers
    .filter((o) => o.description !== correctAnswer)
    .map((o) => o.description);
  const options = buildOptions(correctAnswer, distractors, distractors);

  const explanation =
    `Using backward induction:\n\n` +
    `If Player A moves first: outcome is (${matrix.rowLabels[gameA.backwardInductionOutcome.row]}, ${matrix.colLabels[gameA.backwardInductionOutcome.col]}) with payoffs ${formatPayoffs(outcomeA)}. ` +
    `Player A gets ${outcomeA.a}${nash.length > 0 ? ` vs ${simultaneousA} in the simultaneous game — a gain of ${gainA}` : ""}.\n\n` +
    `If Player B moves first: outcome is (${matrix.rowLabels[gameB.backwardInductionOutcome.row]}, ${matrix.colLabels[gameB.backwardInductionOutcome.col]}) with payoffs ${formatPayoffs(outcomeB)}. ` +
    `Player B gets ${outcomeB.b}${nash.length > 0 ? ` vs ${simultaneousB} in the simultaneous game — a gain of ${gainB}` : ""}.\n\n` +
    `The highest profit comes from: ${bestOffer.description}.`;

  // Suppress unused parameter warning
  void sequentialGame;

  return {
    id: generateId(),
    category: "consulting_offer",
    difficulty,
    text: `You can assist either Player A or Player B to effectively move first. Each player knows that failing to hire you means the other player will. Assuming both respond rationally, which offer delivers the highest profit for you?`,
    options,
    correctIndex: options.indexOf(correctAnswer),
    explanation,
  };
}

function buildBackwardInductionExplanation(
  matrix: PayoffMatrix,
  game: SequentialGame
): string {
  const fm = game.firstMover;
  const sm = fm === "A" ? "B" : "A";
  const fmStrategies = fm === "A" ? matrix.rowLabels : matrix.colLabels;
  const smStrategies = sm === "A" ? matrix.rowLabels : matrix.colLabels;

  const lines: string[] = [];
  lines.push(`Backward Induction (Player ${fm} moves first):\n`);

  // Step 1: For each first-mover choice, determine what second mover does
  lines.push(`Step 1 — Determine Player ${sm}'s best response to each of Player ${fm}'s moves:\n`);

  for (let fi = 0; fi < fmStrategies.length; fi++) {
    let bestSmIdx = 0;
    let bestSmPayoff = -Infinity;
    const payoffDetails: string[] = [];

    for (let si = 0; si < smStrategies.length; si++) {
      const row = fm === "A" ? fi : si;
      const col = fm === "A" ? si : fi;
      const payoff = sm === "A" ? matrix.cells[row][col].a : matrix.cells[row][col].b;
      payoffDetails.push(`${smStrategies[si]} → ${payoff}`);
      if (payoff > bestSmPayoff) {
        bestSmPayoff = payoff;
        bestSmIdx = si;
      }
    }

    lines.push(
      `  If ${fm} plays "${fmStrategies[fi]}": Player ${sm}'s payoffs are [${payoffDetails.join(", ")}]. Best response: "${smStrategies[bestSmIdx]}" (payoff = ${bestSmPayoff}).`
    );
  }

  // Step 2: First mover anticipates and picks best
  lines.push(`\nStep 2 — Player ${fm} anticipates these responses and picks the best:\n`);

  let bestFmIdx = 0;
  let bestFmPayoff = -Infinity;

  for (let fi = 0; fi < fmStrategies.length; fi++) {
    // Find second mover's best response
    let bestSmIdx = 0;
    let bestSmPayoff = -Infinity;
    for (let si = 0; si < smStrategies.length; si++) {
      const row = fm === "A" ? fi : si;
      const col = fm === "A" ? si : fi;
      const payoff = sm === "A" ? matrix.cells[row][col].a : matrix.cells[row][col].b;
      if (payoff > bestSmPayoff) {
        bestSmPayoff = payoff;
        bestSmIdx = si;
      }
    }

    const row = fm === "A" ? fi : bestSmIdx;
    const col = fm === "A" ? bestSmIdx : fi;
    const fmPayoff = fm === "A" ? matrix.cells[row][col].a : matrix.cells[row][col].b;

    lines.push(
      `  "${fmStrategies[fi]}" → ${sm} responds "${smStrategies[bestSmIdx]}" → Player ${fm} gets ${fmPayoff}`
    );

    if (fmPayoff > bestFmPayoff) {
      bestFmPayoff = fmPayoff;
      bestFmIdx = fi;
    }
  }

  const outRow = game.backwardInductionOutcome.row;
  const outCol = game.backwardInductionOutcome.col;
  lines.push(
    `\nEquilibrium: Player ${fm} chooses "${fmStrategies[bestFmIdx]}", leading to outcome (${matrix.rowLabels[outRow]}, ${matrix.colLabels[outCol]}) with payoffs ${formatPayoffs(matrix.cells[outRow][outCol])}.`
  );

  return lines.join("\n");
}

// ── Option Builder ──────────────────────────────────────────────

function buildOptions(
  correctAnswer: string,
  distractors: string[],
  pool: string[]
): string[] {
  const shuffledDistractors = shuffle(distractors);
  const options: string[] = [correctAnswer];

  for (const d of shuffledDistractors) {
    if (options.length >= 4) break;
    if (!options.includes(d)) {
      options.push(d);
    }
  }

  while (options.length < 4) {
    const combo = shuffle(pool).slice(0, Math.min(2, pool.length));
    const option = combo.join(", ");
    if (!options.includes(option)) {
      options.push(option);
    } else {
      options.push(`Option ${options.length + 1}`);
    }
  }

  if (correctAnswer === "None of the Above") {
    const nonNota = options.filter((o) => o !== "None of the Above");
    const shuffled = shuffle(nonNota).slice(0, 4);
    shuffled.push("None of the Above");
    return shuffled;
  }

  const first4 = shuffle(options.slice(0, 4));
  first4.push("None of the Above");

  const correctIdx = first4.indexOf(correctAnswer);
  if (correctIdx === -1) {
    first4[0] = correctAnswer;
  }

  return first4;
}

// ── Explanation Builders ────────────────────────────────────────

function buildDominatedExplanation(
  matrix: PayoffMatrix,
  strictlyDominated: {
    dominated: { player: string; label: string; index: number };
    by: { label: string; index: number };
    strict: boolean;
  }[]
): string {
  if (strictlyDominated.length === 0) {
    return "No strategy is strictly dominated in this game. For each strategy, there is at least one opponent's choice where it performs best (or tied).";
  }

  const lines = strictlyDominated.map((d) => {
    if (d.dominated.player === "A") {
      const payoffs = Array.from({ length: matrix.cols }, (_, c) => {
        return `column ${matrix.colLabels[c]}: ${matrix.cells[d.dominated.index][c].a} < ${matrix.cells[d.by.index][c].a}`;
      });
      return `Player A's "${d.dominated.label}" is strictly dominated by "${d.by.label}": ${payoffs.join("; ")}.`;
    } else {
      const payoffs = Array.from({ length: matrix.rows }, (_, r) => {
        return `row ${matrix.rowLabels[r]}: ${matrix.cells[r][d.dominated.index].b} < ${matrix.cells[r][d.by.index].b}`;
      });
      return `Player B's "${d.dominated.label}" is strictly dominated by "${d.by.label}": ${payoffs.join("; ")}.`;
    }
  });

  return lines.join("\n");
}

function buildNashExplanation(
  matrix: PayoffMatrix,
  nash: {
    row: number;
    col: number;
    rowLabel: string;
    colLabel: string;
    payoffs: { a: number; b: number };
  }[]
): string {
  if (nash.length === 0) {
    return "There are no pure-strategy Nash Equilibria. At every outcome, at least one player could improve by switching strategies.";
  }

  const lines: string[] = [];
  for (const ne of nash) {
    const cell = matrix.cells[ne.row][ne.col];
    let bestAInCol = -Infinity;
    for (let r2 = 0; r2 < matrix.rows; r2++) {
      bestAInCol = Math.max(bestAInCol, matrix.cells[r2][ne.col].a);
    }
    let bestBInRow = -Infinity;
    for (let c2 = 0; c2 < matrix.cols; c2++) {
      bestBInRow = Math.max(bestBInRow, matrix.cells[ne.row][c2].b);
    }
    lines.push(
      `(${ne.rowLabel}, ${ne.colLabel}) with payoffs ${formatPayoffs(cell)} IS a Nash Equilibrium: Player A's payoff of ${cell.a} is the best in column ${ne.colLabel} (max = ${bestAInCol}), and Player B's payoff of ${cell.b} is the best in row ${ne.rowLabel} (max = ${bestBInRow}).`
    );
  }

  return lines.join("\n");
}
