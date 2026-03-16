export function normalizeIngredientName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b(organic|fresh|large|small)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toTitleCase(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
