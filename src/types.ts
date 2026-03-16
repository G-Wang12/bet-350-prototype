export type DietaryPreference =
  | "none"
  | "vegetarian"
  | "vegan"
  | "glutenFree"
  | "dairyFree"
  | "nutFree";

export type Difficulty = "easy" | "medium";

export type FoodCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "seafood"
  | "pantry"
  | "frozen"
  | "condiment"
  | "leftovers"
  | "other";

export type Unit = "each" | "g" | "ml" | "tbsp" | "tsp" | "cup";

export type InventoryItem = {
  id: string;
  name: string;
  normalizedName: string;
  category: FoodCategory;
  quantity?: number;
  unit?: Unit;
  addedAtIso: string;
  expiresAtIso?: string;
  lastSeenAtIso: string;
};

export type FridgeInventory = {
  items: InventoryItem[];
};

export type ScanInput = {
  imageDataUrl?: string;
  detectedItems: Array<{
    name: string;
    category?: FoodCategory;
    expiresInDays?: number;
  }>;
  notes?: string;
};

export type FridgeSnapshot = {
  id: string;
  createdAtIso: string;
  thumbnailDataUrl?: string;
  items: Array<{
    name: string;
    category: FoodCategory;
  }>;
};

export type Reminder = {
  itemId: string;
  itemName: string;
  daysLeft: number;
  expiresAtIso?: string;
  severity: "ok" | "soon" | "urgent";
};

export type RecipeIngredient = {
  name: string;
  normalizedName: string;
  optional?: boolean;
};

export type RecipeStep = {
  id: string;
  instruction: string;
  visual?: {
    kind: "illustration" | "video";
    label: string;
    // Optional URL for prototype; can be empty
    url?: string;
  };
  tip?: string;
  timerSeconds?: number;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  difficulty: Difficulty;
  dietaryTags: DietaryPreference[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type Preferences = {
  timeAvailableMinutes: number;
  dietary: DietaryPreference;
  maxMissingItems: 0 | 1 | 2;
};

export type AppState = {
  inventory: FridgeInventory;
  snapshots: FridgeSnapshot[];
  preferences: Preferences;
  recipes: Recipe[];
};
