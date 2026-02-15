export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Dominated Strategy",
    definition:
      "A choice in a game that always results in a worse payoff for a player than another available strategy, no matter what the other players do.",
  },
  {
    term: "Dominant Strategy",
    definition:
      "A specific action that provides a player with the highest possible payoff, regardless of the strategies chosen by other players. It is the optimal, best-choice move in any scenario.",
  },
  {
    term: "IEDS (Iterated Elimination of Dominated Strategies)",
    definition:
      "A process that simplifies game theory scenarios by repeatedly removing strategies that are always worse for a player regardless of the opponent's choice. It reduces the payoff matrix to find a stable outcome.",
  },
  {
    term: "Payoff Matrix",
    definition:
      "A grid mapping strategies of Player A (rows) against Player B (columns). Each cell contains the payoffs for both players at that strategy combination.",
  },
  {
    term: "Nash Equilibrium",
    definition:
      "A specific outcome where neither player can benefit by changing their strategy, assuming the other player keeps theirs unchanged. No player has an incentive to deviate unilaterally.",
  },
  {
    term: "Simultaneous Game",
    definition:
      "A game where players choose strategies at the same time without knowing opponents' moves. Represented by a payoff matrix, these games focus on Nash equilibria.",
  },
  {
    term: "Sequential Game",
    definition:
      "A game involving ordered, turn-based moves where players observe prior actions. Often solved using backward induction or game trees, where the first mover's choice affects subsequent decisions.",
  },
];
