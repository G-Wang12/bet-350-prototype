export function uid(prefix = "id"): string {
  // Good enough for a prototype (no backend)
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
