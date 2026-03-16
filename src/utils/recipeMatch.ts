import type { FridgeInventory, Preferences, Recipe } from "../types";
import { normalizeIngredientName } from "./strings";
import { isRecipeAllowedByDiet } from "./state";

export type RecipeMatch = {
  recipe: Recipe;
  missingRequired: string[];
  missingRequiredCount: number;
  ingredientUsagePercent: number;
  score: number;
  usedAvailableCount: number;
  totalIngredientCount: number;
  hasAllRequired: boolean;
};

export function buildInventorySet(inventory: FridgeInventory): Set<string> {
  return new Set(
    inventory.items.map(
      (i) => i.normalizedName || normalizeIngredientName(i.name),
    ),
  );
}

export function computeRecipeMatch(
  recipe: Recipe,
  inventorySet: Set<string>,
  preferences: Preferences,
): RecipeMatch | null {
  if (!isRecipeAllowedByDiet(preferences.dietary, recipe.dietaryTags))
    return null;

  const required = recipe.ingredients.filter((i) => !i.optional);
  const optional = recipe.ingredients.filter((i) => i.optional);

  const missingRequired = required
    .filter((i) => !inventorySet.has(i.normalizedName))
    .map((i) => i.name);

  const missingRequiredCount = missingRequired.length;
  if (missingRequiredCount > preferences.maxMissingItems) return null;
  if (recipe.timeMinutes > preferences.timeAvailableMinutes) return null;

  const haveRequired = required.length - missingRequiredCount;
  const haveOptional = optional.filter((i) =>
    inventorySet.has(i.normalizedName),
  ).length;

  const totalIngredientCount = recipe.ingredients.length;
  const usedAvailableCount = recipe.ingredients.filter((i) =>
    inventorySet.has(i.normalizedName),
  ).length;

  const ingredientUsagePercent =
    totalIngredientCount === 0
      ? 0
      : Math.round((usedAvailableCount / totalIngredientCount) * 100);

  // Scoring: prioritize required match, then optional, then time fit.
  const requiredScore =
    required.length === 0 ? 1 : haveRequired / required.length;
  const optionalScore =
    optional.length === 0 ? 0 : haveOptional / optional.length;
  const timeScore =
    preferences.timeAvailableMinutes <= 0
      ? 0
      : recipe.timeMinutes / preferences.timeAvailableMinutes;
  const timeFit = 1 - Math.min(1, Math.max(0, timeScore - 1));

  const score = requiredScore * 0.7 + optionalScore * 0.15 + timeFit * 0.15;

  return {
    recipe,
    missingRequired,
    missingRequiredCount,
    ingredientUsagePercent,
    score,
    usedAvailableCount,
    totalIngredientCount,
    hasAllRequired: missingRequiredCount === 0,
  };
}

export function rankRecipes(
  recipes: Recipe[],
  inventory: FridgeInventory,
  preferences: Preferences,
): RecipeMatch[] {
  const invSet = buildInventorySet(inventory);
  const matches = recipes
    .map((r) => computeRecipeMatch(r, invSet, preferences))
    .filter((m): m is RecipeMatch => Boolean(m));

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.ingredientUsagePercent !== a.ingredientUsagePercent)
      return b.ingredientUsagePercent - a.ingredientUsagePercent;
    return a.recipe.timeMinutes - b.recipe.timeMinutes;
  });

  return matches;
}

export function suggestFromLeftovers(
  recipes: Recipe[],
  inventory: FridgeInventory,
  usedNormalizedNames: string[],
  preferences: Preferences,
): RecipeMatch[] {
  const usedSet = new Set(usedNormalizedNames);
  const leftover: FridgeInventory = {
    items: inventory.items.filter((i) => !usedSet.has(i.normalizedName)),
  };

  return rankRecipes(recipes, leftover, preferences);
}
