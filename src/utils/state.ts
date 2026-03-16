import type {
  AppState,
  DietaryPreference,
  FoodCategory,
  FridgeInventory,
  FridgeSnapshot,
  InventoryItem,
  Preferences,
  Reminder,
  ScanInput,
} from "../types";
import { uid } from "./id";
import { getMockRecipes } from "./mockRecipes";
import { normalizeIngredientName, clamp } from "./strings";

const STORAGE_KEY = "fridge_to_meal_state_v1";

const SHELF_LIFE_DAYS: Record<string, number> = {
  milk: 7,
  "greek yogurt": 10,
  yogurt: 10,
  egg: 21,
  eggs: 21,
  spinach: 5,
  lettuce: 5,
  tomato: 6,
  avocado: 4,
  banana: 5,
  berries: 4,
  strawberry: 4,
  strawberries: 4,
  cucumber: 7,
  broccoli: 6,
  chicken: 3,
  tofu: 7,
  "canned tuna": 365,
  "canned chickpeas": 365,
  cheese: 14,
  mozzarella: 10,
};

export function defaultPreferences(): Preferences {
  return {
    timeAvailableMinutes: 20,
    dietary: "none",
    maxMissingItems: 2,
  };
}

export function defaultAppState(): AppState {
  return {
    inventory: { items: [] },
    snapshots: [],
    preferences: defaultPreferences(),
    recipes: getMockRecipes(),
  };
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;

    // Basic shape guards (prototype-level)
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.inventory || !Array.isArray(parsed.inventory.items))
      return null;

    // Backfill recipes (we keep recipes in code, but store anyway to keep state self-contained)
    if (
      !parsed.recipes ||
      !Array.isArray(parsed.recipes) ||
      parsed.recipes.length === 0
    ) {
      parsed.recipes = getMockRecipes();
    }

    // Backfill preferences
    if (!parsed.preferences) parsed.preferences = defaultPreferences();
    parsed.preferences.timeAvailableMinutes = clamp(
      Number(parsed.preferences.timeAvailableMinutes ?? 20),
      5,
      60,
    );
    parsed.preferences.maxMissingItems = Number(
      parsed.preferences.maxMissingItems ?? 2,
    ) as 0 | 1 | 2;

    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore for prototype (storage full, etc.)
  }
}

export function estimateCategory(name: string): FoodCategory {
  const n = normalizeIngredientName(name);
  const produce = [
    "tomato",
    "spinach",
    "lettuce",
    "avocado",
    "banana",
    "berries",
    "cucumber",
    "broccoli",
    "carrot",
    "green onion",
    "lemon",
    "basil",
  ];
  const dairy = [
    "milk",
    "yogurt",
    "greek yogurt",
    "cheddar cheese",
    "mozzarella",
    "parmesan",
    "butter",
    "feta",
  ];
  const meat = ["chicken"];
  const pantry = [
    "pasta",
    "bread",
    "tortilla",
    "soy sauce",
    "rice",
    "cooked rice",
    "canned tuna",
    "canned chickpeas",
    "black beans",
    "salsa",
    "mayonnaise",
    "olive oil",
    "balsamic vinegar",
    "honey",
    "granola",
    "peanut butter",
    "sriracha",
    "sesame oil",
    "garlic",
    "nori",
  ];
  const frozen = ["frozen peas", "frozen berries"];

  if (produce.includes(n)) return "produce";
  if (dairy.includes(n)) return "dairy";
  if (meat.includes(n)) return "meat";
  if (frozen.includes(n)) return "frozen";
  if (pantry.includes(n)) return "pantry";
  return "other";
}

export function estimateExpiresAtIso(
  name: string,
  addedAtIso: string,
): string | undefined {
  const n = normalizeIngredientName(name);
  const days = SHELF_LIFE_DAYS[n];
  if (!days) return undefined;
  const added = new Date(addedAtIso);
  const expires = new Date(added.getTime() + days * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}

export function createSnapshotFromScan(scan: ScanInput): FridgeSnapshot {
  const createdAtIso = new Date().toISOString();
  return {
    id: uid("snap"),
    createdAtIso,
    thumbnailDataUrl: scan.imageDataUrl,
    items: scan.detectedItems
      .map((it) => {
        const category = it.category ?? estimateCategory(it.name);
        return { name: it.name, category };
      })
      .filter((it) => it.name.trim().length > 0)
      .slice(0, 60),
  };
}

export function addOrUpdateInventoryFromScan(
  inventory: FridgeInventory,
  scan: ScanInput,
): FridgeInventory {
  const nowIso = new Date().toISOString();
  const map = new Map(inventory.items.map((i) => [i.normalizedName, i]));

  for (const it of scan.detectedItems) {
    const normalizedName = normalizeIngredientName(it.name);
    if (!normalizedName) continue;

    const category = it.category ?? estimateCategory(it.name);
    const existing = map.get(normalizedName);

    const expiresAtIsoFromDays =
      typeof it.expiresInDays === "number" && it.expiresInDays >= 0
        ? new Date(
            Date.now() + it.expiresInDays * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined;

    if (existing) {
      const next: InventoryItem = {
        ...existing,
        name: existing.name || it.name,
        category: existing.category || category,
        lastSeenAtIso: nowIso,
        expiresAtIso: existing.expiresAtIso ?? expiresAtIsoFromDays,
      };
      map.set(normalizedName, next);
      continue;
    }

    const addedAtIso = nowIso;
    const expiresAtIso =
      expiresAtIsoFromDays ?? estimateExpiresAtIso(it.name, addedAtIso);

    map.set(normalizedName, {
      id: uid("inv"),
      name: it.name,
      normalizedName,
      category,
      addedAtIso,
      lastSeenAtIso: nowIso,
      expiresAtIso,
    });
  }

  return {
    items: Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

export function addOrUpdateInventoryFromSnapshot(
  inventory: FridgeInventory,
  snapshot: FridgeSnapshot,
): FridgeInventory {
  const nowIso = new Date().toISOString();
  const map = new Map(inventory.items.map((i) => [i.normalizedName, i]));

  for (const sItem of snapshot.items) {
    const normalizedName = normalizeIngredientName(sItem.name);
    if (!normalizedName) continue;

    const existing = map.get(normalizedName);
    if (existing) {
      existing.lastSeenAtIso = nowIso;
      // Keep original addedAt; keep expires if set
      map.set(normalizedName, {
        ...existing,
        name: existing.name || sItem.name,
      });
      continue;
    }

    const addedAtIso = nowIso;
    const expiresAtIso = estimateExpiresAtIso(sItem.name, addedAtIso);

    const newItem: InventoryItem = {
      id: uid("inv"),
      name: sItem.name,
      normalizedName,
      category: sItem.category,
      addedAtIso,
      lastSeenAtIso: nowIso,
      expiresAtIso,
    };

    map.set(normalizedName, newItem);
  }

  return {
    items: Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

export function computeReminders(inventory: FridgeInventory): Reminder[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const reminders: Reminder[] = [];

  for (const item of inventory.items) {
    if (!item.expiresAtIso) continue;
    const expires = new Date(item.expiresAtIso).getTime();
    if (!Number.isFinite(expires)) continue;

    const daysLeft = Math.ceil((expires - now) / dayMs);
    const severity: Reminder["severity"] =
      daysLeft <= 0 ? "urgent" : daysLeft <= 2 ? "soon" : "ok";

    if (severity === "ok") continue;

    reminders.push({
      itemId: item.id,
      itemName: item.name,
      daysLeft,
      expiresAtIso: item.expiresAtIso,
      severity,
    });
  }

  return reminders.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function isRecipeAllowedByDiet(
  dietary: DietaryPreference,
  recipeTags: DietaryPreference[],
): boolean {
  if (dietary === "none") return true;
  return recipeTags.includes(dietary);
}
