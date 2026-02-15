import { Payoffs, PlayerLabel } from "./types";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function formatPayoffs(p: Payoffs): string {
  return `(${p.a}, ${p.b})`;
}

export function strategyLabel(
  player: PlayerLabel,
  index: number,
  size: number
): string {
  if (player === "A") {
    return size === 2
      ? ["Top", "Bottom"][index]
      : ["Top", "Middle", "Bottom"][index];
  }
  return size === 2
    ? ["Left", "Right"][index]
    : ["Left", "Center", "Right"][index];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
