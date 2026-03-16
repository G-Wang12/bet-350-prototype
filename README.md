# Fridge-to-Meal (Frontend-only Prototype)

React + TypeScript prototype for a UX class: take a fridge photo, confirm ingredients, and get ranked 20-minute recipe suggestions.

**No backend.** All state is saved to `localStorage`.

## Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## What’s implemented

- **Scan flow**: upload/take a fridge photo (stored as a small thumbnail), then confirm/edit detected items.
  - Detection is **mocked** with preset “fridges” + manual add/edit (because this is frontend-only).
- **Fridge tracking**: inventory persists across sessions; you can edit items + expiry dates.
- **Reminders**: items with expiry dates show “soon/urgent” when close to expiring.
- **Ingredient-based recipe search**:
  - Strictly filters recipes to **≤ 0–2 missing required items** (your choice).
  - Filters to recipes that fit your **time available** (5–30 minutes) and **dietary preference**.
  - Ranks by “best match” and shows **time, difficulty, ingredient usage %, missing items**.
- **Step-by-step cooking mode**: **one instruction per screen**, optional timer per step, visual guidance placeholder.
- **Automatic follow-up suggestions**: after finishing, it suggests next recipes based on leftover ingredients.

## Where the logic lives

- App shell + navigation: `src/App.tsx`
- State + reminders: `src/utils/state.ts`
- Recipe matching/ranking: `src/utils/recipeMatch.ts`
- Mock recipes dataset: `src/utils/mockRecipes.ts`
- Screens:
  - `src/features/scan/ScanScreen.tsx`
  - `src/features/fridge/FridgeScreen.tsx`
  - `src/features/recipes/RecipesScreen.tsx`
  - `src/features/cook/CookMode.tsx`
