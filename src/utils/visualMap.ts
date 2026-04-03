// Use Vite's import.meta.glob to eagerly resolve asset URLs. This guarantees
// URLs are correct under the dev server and in production builds.
const modules = import.meta.glob("../assets/visual_assistance_photos/**/*", {
  as: "url",
  eager: true,
}) as Record<string, string>;

// Build a map from filename (basename) to resolved URL
const FILE_URL_BY_BASENAME: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  // path looks like '/src/assets/visual_assistance_photos/...'
  const parts = path.split("/");
  const filename = parts[parts.length - 1];
  FILE_URL_BY_BASENAME[filename] = url;
}

// Map of instruction -> basename (exact filenames found in assets)
const MAP_RAW: Record<string, string> = {
  "Add berries and drizzle honey. Top with granola if you have it.": `Add berries and drizzle honey. Top with granola if you have it..jpg`,
  "Add cheese (and optional fillings) to one half.": `Add cheese (and optional fillings) to one half..webp`,
  "Add ingredients to blender.": `Add ingredients to blender..jpg`,
  "Add lettuce to tortilla and spoon chicken mix on top.": `Add lettuce to tortilla and spoon chicken mix on top..jpg`,
  "Add rice and stir-fry to break up clumps.": `Add rice and stir-fry to break up clumps..jpg`,
  "Add soy sauce and any quick veggies; stir 2–3 minutes.": `Add soy sauce and any quick veggies; stir 2–3 minutes..jpg`,
  "Add soy sauce and serve (over rice if available).": `Add soy sauce and serve (over rice if available)..jpg`,
  "Add veggies and stir-fry 3–5 minutes.": `Add veggies and stir-fry 3–5 minutes..jpg`,
  "Blend until smooth (30–60 seconds).": `Blend until smooth (30–60 seconds)..avif`,
  "Boil pasta until al dente.": `Boil pasta until al dente..jpg`,
  "Chop any veggies you have and add them.": `Chop any veggies you have and add them..jpg`,
  "Cook an egg if you want (fried or boiled).": `Cook an egg if you want (fried or boiled)..webp`,
  "Dress with lemon + olive oil + salt. Toss and eat.": `Dress with lemon + olive oil + salt. Toss and eat..jpg`,
  "Fold, cook 2–3 minutes per side until golden.": `Fold, cook 2–3 minutes per side until golden..jpg`,
  "Heat a pan on medium and place tortilla down.": `Heat a pan on medium and place tortilla down..jpg`,
  "Heat a pan on medium-high and add a little oil.": `Heat a pan on medium-high and add a little oil..jpg`,
  "Layer on toast. Add basil + drizzle oil/vinegar.": `vinegar..jpg`,
  "Melt butter and sauté garlic 30–60 seconds.": `Melt butter and sauté garlic 30–60 seconds..jpeg`,
  "Mix chopped chicken with mayo (and celery if you have it).": `Mix chopped chicken with mayo (and celery if you have it)..webp`,
  "Mix tuna + mayo (and a little soy sauce if you want).": `Mix tuna + mayo (and a little soy sauce if you want)..webp`,
  "Pour and drink.": `Pour and drink..jpg`,
  "Press tofu quickly with a towel; cube it.": `Press tofu quickly with a towel; cube it..jpg`,
  "Put rice in a bowl and add the tuna mix on top.": `Put rice in a bowl and add the tuna mix on top..jpg`,
  "Rinse chickpeas and add to a bowl.": `Rinse chickpeas and add to a bowl..webp`,
  "Roll up and eat.": `Roll up and eat..jpg`,
  "Scramble the egg quickly, then push it to the side.": `Scramble the egg quickly, then push it to the side..webp`,
  "Sear tofu in a hot pan 3–4 minutes total.": `Sear tofu in a hot pan 3-4 minutes total..jpg`,
  "Slice and serve with salsa if available.": `Slice and serve with salsa if available..jpg`,
  "Slice tomato and mozzarella.": `Slice tomato and mozzarella..jpg`,
  "Spoon yogurt into a bowl or cup.": `Spoon yogurt into a bowl or cup..jpg`,
  "Spread avocado, top with egg, and eat.": `Spread avocado, top with egg, and eat..jpg`,
  "Taste and adjust. Serve hot.": `Taste and adjust. Serve hot..jpg`,
  "Toast bread. Mash avocado with salt (and lemon if you have it).": `Toast bread. Mash avocado with salt (and lemon if you have it)..jpg`,
  "Toast the bread.": `Toast the bread..jpg`,
  "Top with cucumber/nori/sriracha if available.": `Top with cucumber/nori/sriracha if available..webp`,
  "Toss pasta with garlic butter. Add parmesan/lemon if available.": `lemon if available..jpg`,
};

export function getVisualPath(key?: string): string | undefined {
  if (!key) return undefined;
  function normalize(s: string) {
    return s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\u2013\u2014]/g, "-") // normalize en/em dashes
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'");
  }

  let k = normalize(key);
  if (k.endsWith(".")) k = k.slice(0, -1);
  // build normalized lookup map once
  const MAP_NORM: Record<string, string> = {};
  for (const [orig, relPath] of Object.entries(MAP_RAW)) {
    MAP_NORM[normalize(orig).replace(/\.+$/, "")] = relPath;
  }
  const rel = MAP_NORM[k] ?? MAP_RAW[k];
  if (!rel) return undefined;

  // Prefer the URL resolved by import.meta.glob (handles nested folders)
  const byBasename = FILE_URL_BY_BASENAME[rel];
  if (byBasename) return byBasename;

  // fallback: try to find by normalized basename (strip punctuation)
  const maybe = Object.entries(FILE_URL_BY_BASENAME).find(
    ([name]) =>
      name.replace(/[^a-z0-9.-]/gi, "").toLowerCase() ===
      rel.replace(/[^a-z0-9.-]/gi, "").toLowerCase(),
  );
  if (maybe) return maybe[1];

  try {
    return new URL(`../assets/${rel}`, import.meta.url).href;
  } catch {
    return undefined;
  }
}

export default getVisualPath;
