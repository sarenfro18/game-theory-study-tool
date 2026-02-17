export type PlayerLabel = "A" | "B";

export interface Payoffs {
  a: number;
  b: number;
}

export interface PayoffMatrix {
  rows: number;
  cols: number;
  cells: Payoffs[][];
  rowLabels: string[];
  colLabels: string[];
}

export interface CellCoord {
  row: number;
  col: number;
}

export interface CircledPayoff {
  coord: CellCoord;
  player: PlayerLabel;
}

export interface EliminationState {
  eliminatedRows: number[];
  eliminatedCols: number[];
  circledPayoffs: CircledPayoff[];
}

export interface Strategy {
  player: PlayerLabel;
  index: number;
  label: string;
}

export interface DominationResult {
  dominated: Strategy;
  by: Strategy;
  strict: boolean;
}

export interface NashEquilibrium {
  row: number;
  col: number;
  rowLabel: string;
  colLabel: string;
  payoffs: Payoffs;
}

export interface IEDSStep {
  eliminated: Strategy;
  reason: string;
}

export interface IEDSResult {
  steps: IEDSStep[];
  survivingCells: CellCoord[];
  residualMatrix: PayoffMatrix | null;
}

export interface DecisionNode {
  id: string;
  player: PlayerLabel;
  label: string;
  children: DecisionEdge[];
}

export interface DecisionEdge {
  label: string;
  child: DecisionNode | LeafNode;
}

export interface LeafNode {
  id: string;
  payoffs: Payoffs;
  isTerminal: true;
}

export interface SequentialGame {
  matrix: PayoffMatrix;
  tree: DecisionNode;
  firstMover: PlayerLabel;
  backwardInductionPath: string[];
  backwardInductionOutcome: CellCoord;
}

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionCategory =
  | "find_dominated_strategies"
  | "ieds_survivors"
  | "nash_equilibrium"
  | "select_all_nash"
  | "residual_game"
  | "count_nash"
  | "willingness_to_pay"
  | "true_false"
  | "sequential_first_mover"
  | "sequential_second_mover"
  | "sequential_best_response"
  | "consulting_offer";

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctIndex: number;
  /** For multi-select questions, all correct indices */
  correctIndices?: number[];
  /** Whether this question uses multi-select (checkboxes) */
  multiSelect?: boolean;
  explanation: string;
}

export interface TreeHighlightedEdge {
  parentId: string;
  edgeLabel: string;
}

export interface TreeState {
  highlightedEdges: TreeHighlightedEdge[];
  /** Map from leafId to student-assigned payoffs */
  leafPayoffs: Record<string, Payoffs>;
}

export interface GameState {
  difficulty: Difficulty;
  matrix: PayoffMatrix;
  sequentialGame: SequentialGame | null;
  question: Question;
  elimination: EliminationState;
  treeState: TreeState;
  selectedAnswer: number | null;
  selectedAnswers: number[];
  isSubmitted: boolean;
  isCorrect: boolean | null;
  score: { correct: number; total: number };
}

export type GameAction =
  | { type: "NEW_GAME" }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty }
  | { type: "SELECT_ANSWER"; index: number }
  | { type: "TOGGLE_ANSWER"; index: number }
  | { type: "SUBMIT_ANSWER" }
  | { type: "TOGGLE_ELIMINATE_ROW"; row: number }
  | { type: "TOGGLE_ELIMINATE_COL"; col: number }
  | { type: "TOGGLE_CIRCLE_PAYOFF"; coord: CellCoord; player: PlayerLabel }
  | { type: "RESET_MARKINGS" }
  | { type: "SET_FIRST_MOVER"; player: PlayerLabel }
  | { type: "TOGGLE_TREE_EDGE"; parentId: string; edgeLabel: string }
  | { type: "ASSIGN_LEAF_PAYOFF"; leafId: string; payoffs: Payoffs }
  | { type: "CLEAR_LEAF_PAYOFF"; leafId: string }
  | { type: "RESET_TREE" };
