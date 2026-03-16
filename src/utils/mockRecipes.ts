import type { Recipe } from "../types";
import { normalizeIngredientName } from "./strings";
import { uid } from "./id";

function ing(name: string, optional = false) {
  return { name, normalizedName: normalizeIngredientName(name), optional };
}

function step(
  instruction: string,
  opts?: { tip?: string; timerSeconds?: number; visualLabel?: string },
) {
  return {
    id: uid("step"),
    instruction,
    tip: opts?.tip,
    timerSeconds: opts?.timerSeconds,
    visual: opts?.visualLabel
      ? {
          kind: "illustration" as const,
          label: opts.visualLabel,
        }
      : undefined,
  };
}

export function getMockRecipes(): Recipe[] {
  return [
    {
      id: "r_egg_fried_rice",
      title: "Egg Fried Rice (Quick)",
      description: "Fast, flexible, and great for using leftovers.",
      timeMinutes: 15,
      difficulty: "easy",
      dietaryTags: ["none", "vegetarian"],
      ingredients: [
        ing("cooked rice"),
        ing("egg"),
        ing("soy sauce"),
        ing("green onion", true),
        ing("garlic", true),
        ing("frozen peas", true),
        ing("carrot", true),
        ing("sesame oil", true),
      ],
      steps: [
        step("Heat a pan on medium-high and add a little oil.", {
          visualLabel: "Pan + oil",
        }),
        step("Scramble the egg quickly, then push it to the side.", {
          visualLabel: "Scramble egg",
        }),
        step("Add rice and stir-fry to break up clumps.", {
          tip: "If rice is cold, it fries better.",
          visualLabel: "Rice in pan",
        }),
        step("Add soy sauce and any quick veggies; stir 2–3 minutes.", {
          timerSeconds: 150,
          visualLabel: "Stir-fry",
        }),
        step("Taste and adjust. Serve hot.", { visualLabel: "Serve" }),
      ],
    },
    {
      id: "r_tuna_mayo_rice_bowl",
      title: "Tuna Mayo Rice Bowl",
      description: "No-stove lunch if you have rice ready.",
      timeMinutes: 8,
      difficulty: "easy",
      dietaryTags: ["none"],
      ingredients: [
        ing("cooked rice"),
        ing("canned tuna"),
        ing("mayonnaise"),
        ing("soy sauce", true),
        ing("cucumber", true),
        ing("nori", true),
        ing("sriracha", true),
      ],
      steps: [
        step("Mix tuna + mayo (and a little soy sauce if you want).", {
          visualLabel: "Mix tuna",
        }),
        step("Put rice in a bowl and add the tuna mix on top.", {
          visualLabel: "Assemble bowl",
        }),
        step("Top with cucumber/nori/sriracha if available.", {
          visualLabel: "Top it",
        }),
      ],
    },
    {
      id: "r_caprese_toast",
      title: "Caprese Toast",
      description: "Tomato + mozzarella + basil on toast.",
      timeMinutes: 10,
      difficulty: "easy",
      dietaryTags: ["vegetarian"],
      ingredients: [
        ing("bread"),
        ing("tomato"),
        ing("mozzarella"),
        ing("basil", true),
        ing("olive oil", true),
        ing("balsamic vinegar", true),
      ],
      steps: [
        step("Toast the bread.", { visualLabel: "Toast" }),
        step("Slice tomato and mozzarella.", { visualLabel: "Slice" }),
        step("Layer on toast. Add basil + drizzle oil/vinegar.", {
          visualLabel: "Assemble",
        }),
      ],
    },
    {
      id: "r_greek_yogurt_parfait",
      title: "Greek Yogurt Parfait",
      description: "High-protein breakfast in minutes.",
      timeMinutes: 5,
      difficulty: "easy",
      dietaryTags: ["vegetarian", "glutenFree"],
      ingredients: [
        ing("greek yogurt"),
        ing("berries", true),
        ing("honey", true),
        ing("granola", true),
      ],
      steps: [
        step("Spoon yogurt into a bowl or cup.", { visualLabel: "Yogurt" }),
        step(
          "Add berries and drizzle honey. Top with granola if you have it.",
          {
            visualLabel: "Top",
          },
        ),
      ],
    },
    {
      id: "r_quesadilla",
      title: "Cheese Quesadilla",
      description: "Crispy tortilla with melty cheese; add extras if you want.",
      timeMinutes: 12,
      difficulty: "easy",
      dietaryTags: ["vegetarian"],
      ingredients: [
        ing("tortilla"),
        ing("cheddar cheese"),
        ing("salsa", true),
        ing("black beans", true),
        ing("chicken", true),
        ing("spinach", true),
      ],
      steps: [
        step("Heat a pan on medium and place tortilla down.", {
          visualLabel: "Pan",
        }),
        step("Add cheese (and optional fillings) to one half.", {
          visualLabel: "Fill",
        }),
        step("Fold, cook 2–3 minutes per side until golden.", {
          timerSeconds: 300,
          visualLabel: "Flip",
        }),
        step("Slice and serve with salsa if available.", {
          visualLabel: "Serve",
        }),
      ],
    },
    {
      id: "r_avocado_egg_toast",
      title: "Avocado Egg Toast",
      description: "Creamy + filling; works with boiled or fried eggs.",
      timeMinutes: 15,
      difficulty: "easy",
      dietaryTags: ["vegetarian"],
      ingredients: [
        ing("bread"),
        ing("avocado"),
        ing("egg", true),
        ing("lemon", true),
      ],
      steps: [
        step(
          "Toast bread. Mash avocado with salt (and lemon if you have it).",
          {
            visualLabel: "Mash",
          },
        ),
        step("Cook an egg if you want (fried or boiled).", {
          visualLabel: "Egg",
          tip: "Skip egg to keep it ultra fast.",
        }),
        step("Spread avocado, top with egg, and eat.", {
          visualLabel: "Assemble",
        }),
      ],
    },
    {
      id: "r_smoothie",
      title: "5-Minute Smoothie",
      description: "Use any fruit + milk/yogurt.",
      timeMinutes: 5,
      difficulty: "easy",
      dietaryTags: ["vegetarian", "glutenFree"],
      ingredients: [
        ing("banana"),
        ing("milk"),
        ing("frozen berries", true),
        ing("peanut butter", true),
        ing("greek yogurt", true),
      ],
      steps: [
        step("Add ingredients to blender.", { visualLabel: "Blender" }),
        step("Blend until smooth (30–60 seconds).", {
          timerSeconds: 45,
          visualLabel: "Blend",
        }),
        step("Pour and drink.", { visualLabel: "Serve" }),
      ],
    },
    {
      id: "r_chickpea_salad",
      title: "Chickpea Salad Bowl",
      description: "Protein-packed and meal-prep friendly.",
      timeMinutes: 12,
      difficulty: "easy",
      dietaryTags: ["vegan", "vegetarian", "glutenFree"],
      ingredients: [
        ing("canned chickpeas"),
        ing("olive oil", true),
        ing("lemon", true),
        ing("cucumber", true),
        ing("tomato", true),
        ing("feta", true),
      ],
      steps: [
        step("Rinse chickpeas and add to a bowl.", {
          visualLabel: "Chickpeas",
        }),
        step("Chop any veggies you have and add them.", {
          visualLabel: "Chop",
        }),
        step("Dress with lemon + olive oil + salt. Toss and eat.", {
          visualLabel: "Toss",
        }),
      ],
    },
    {
      id: "r_garlic_butter_pasta",
      title: "Garlic Butter Pasta",
      description: "Minimal ingredients, fast comfort food.",
      timeMinutes: 18,
      difficulty: "easy",
      dietaryTags: ["vegetarian"],
      ingredients: [
        ing("pasta"),
        ing("butter"),
        ing("garlic"),
        ing("parmesan", true),
        ing("lemon", true),
      ],
      steps: [
        step("Boil pasta until al dente.", {
          timerSeconds: 600,
          visualLabel: "Boil",
        }),
        step("Melt butter and sauté garlic 30–60 seconds.", {
          timerSeconds: 45,
          visualLabel: "Sauté",
        }),
        step(
          "Toss pasta with garlic butter. Add parmesan/lemon if available.",
          {
            visualLabel: "Toss",
          },
        ),
      ],
    },
    {
      id: "r_chicken_salad_wrap",
      title: "Chicken Salad Wrap",
      description: "Great with rotisserie or leftover chicken.",
      timeMinutes: 10,
      difficulty: "easy",
      dietaryTags: ["none"],
      ingredients: [
        ing("tortilla"),
        ing("chicken"),
        ing("mayonnaise", true),
        ing("celery", true),
        ing("lettuce", true),
      ],
      steps: [
        step("Mix chopped chicken with mayo (and celery if you have it).", {
          visualLabel: "Mix",
        }),
        step("Add lettuce to tortilla and spoon chicken mix on top.", {
          visualLabel: "Fill",
        }),
        step("Roll up and eat.", { visualLabel: "Wrap" }),
      ],
    },
    {
      id: "r_tofu_stir_fry",
      title: "Tofu Veggie Stir-Fry",
      description: "Quick weeknight stir-fry; swap in any vegetables.",
      timeMinutes: 20,
      difficulty: "medium",
      dietaryTags: ["vegan", "vegetarian"],
      ingredients: [
        ing("tofu"),
        ing("soy sauce"),
        ing("garlic", true),
        ing("broccoli", true),
        ing("bell pepper", true),
        ing("carrot", true),
        ing("cooked rice", true),
      ],
      steps: [
        step("Press tofu quickly with a towel; cube it.", {
          visualLabel: "Cube",
        }),
        step("Sear tofu in a hot pan 3–4 minutes total.", {
          timerSeconds: 210,
          visualLabel: "Sear",
        }),
        step("Add veggies and stir-fry 3–5 minutes.", {
          timerSeconds: 240,
          visualLabel: "Veggies",
        }),
        step("Add soy sauce and serve (over rice if available).", {
          visualLabel: "Sauce",
        }),
      ],
    },
  ];
}
