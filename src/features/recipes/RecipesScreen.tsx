import { useMemo, useState } from 'react'
import type { FridgeInventory, Preferences, Recipe } from '../../types'
import { rankRecipes } from '../../utils/recipeMatch'
import { normalizeIngredientName, clamp } from '../../utils/strings'

export function RecipesScreen(props: {
    inventory: FridgeInventory
    preferences: Preferences
    recipes: Recipe[]
    onPreferencesChange: (prefs: Preferences) => void
    onStartCooking: (recipeId: string) => void
}) {
    const [query, setQuery] = useState('')

    function getCharacteristics(recipe: Recipe) {
        const names = `${recipe.title} ${recipe.description} ${recipe.ingredients
            .map((i) => i.name)
            .join(' ')}`.toLowerCase()

        const dairyKeywords = ['milk', 'butter', 'cheese', 'yogurt', 'cream', 'mozzarella', 'parmesan', 'feta']
        const highCalorieKeywords = ['butter', 'mayonnaise', 'avocado', 'peanut butter', 'granola', 'honey', 'olive oil']
        const proteinKeywords = ['chicken', 'tofu', 'tuna', 'egg', 'chickpea', 'black beans', 'greek yogurt', 'lentil', 'beans']

        const isVegetarian = (recipe.dietaryTags || []).includes('vegetarian') || (recipe.dietaryTags || []).includes('vegan')
        const isLactoseFree = (recipe.dietaryTags || []).includes('dairyFree') || !dairyKeywords.some((k) => names.includes(k))
        const hasPeanuts = names.includes('peanut') || names.includes('peanut butter')
        const isProteinRich = proteinKeywords.some((k) => names.includes(k))
        const isLowCalories = !highCalorieKeywords.some((k) => names.includes(k))

        const out: { key: string; label: string }[] = []
        if (isVegetarian) out.push({ key: 'vegetarian', label: 'Vegetarian' })
        if (isLactoseFree) out.push({ key: 'lactoseFree', label: 'Lactose‑free' })
        if (isLowCalories) out.push({ key: 'lowCalories', label: 'Low calories' })
        if (hasPeanuts) out.push({ key: 'peanuts', label: 'Contains peanuts' })
        if (isProteinRich) out.push({ key: 'protein', label: 'Protein‑rich' })

        return out
    }
    const matches = useMemo(() => {
        const base = rankRecipes(props.recipes, props.inventory, props.preferences)
        const q = normalizeIngredientName(query)
        if (!q) return base

        return base.filter((m) => {
            const hay = `${m.recipe.title} ${m.recipe.description}`.toLowerCase()
            if (hay.includes(q)) return true
            return m.recipe.ingredients.some((i) => i.normalizedName.includes(q))
        })
    }, [props.recipes, props.inventory, props.preferences, query])

    const inventoryCount = props.inventory.items.length

    return (
        <div className="screen">
            <div className="screenHeader">
                <h1>Recipes</h1>
                <p className="muted">
                    Showing recipes you can cook in {props.preferences.timeAvailableMinutes} minutes with up to {props.preferences.maxMissingItems} missing items.
                </p>
            </div>

            <section className="panel">
                <div className="panelTitle">Search + preferences</div>

                <div className="grid3">
                    <div className="formRow">
                        <label className="label">Ingredient / recipe search</label>
                        <input
                            className="input"
                            placeholder="Try: egg, tofu, tomato, pasta…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="formRow">
                        <label className="label">Time available</label>
                        <div className="inline">
                            <input
                                className="range"
                                type="range"
                                min={5}
                                max={30}
                                value={props.preferences.timeAvailableMinutes}
                                onChange={(e) =>
                                    props.onPreferencesChange({
                                        ...props.preferences,
                                        timeAvailableMinutes: clamp(Number(e.target.value), 5, 30),
                                    })
                                }
                            />
                            <div className="pill">{props.preferences.timeAvailableMinutes} min</div>
                        </div>
                    </div>

                    <div className="formRow">
                        <label className="label">Dietary</label>
                        <select
                            className="select"
                            value={props.preferences.dietary}
                            onChange={(e) =>
                                props.onPreferencesChange({
                                    ...props.preferences,
                                    dietary: e.target.value as Preferences['dietary'],
                                })
                            }
                        >
                            <option value="none">No preference</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="glutenFree">Gluten-free</option>
                            <option value="dairyFree">Dairy-free</option>
                            <option value="nutFree">Nut-free</option>
                        </select>
                    </div>

                    <div className="formRow">
                        <label className="label">Allowed missing items</label>
                        <select
                            className="select"
                            value={props.preferences.maxMissingItems}
                            onChange={(e) =>
                                props.onPreferencesChange({
                                    ...props.preferences,
                                    maxMissingItems: Number(e.target.value) as 0 | 1 | 2,
                                })
                            }
                        >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                        <div className="help">Missing counts only required ingredients (optional don’t count).</div>
                    </div>

                    <div className="formRow">
                        <label className="label">Fridge items</label>
                        <div className="pill">{inventoryCount}</div>
                        <div className="help">If you have 0 items, go to Scan first.</div>
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panelTitle">Best matches</div>
                {matches.length === 0 ? (
                    <div className="emptyState">
                        No recipes match right now. Try increasing allowed missing items (up to 2), increasing time, or scanning more ingredients.
                    </div>
                ) : (
                    <div className="cards">
                        {matches.map((m) => (
                            <div key={m.recipe.id} className="card">
                                <div className="cardTop">
                                    <div>
                                        <div className="cardTitle">{m.recipe.title}</div>
                                        <div className="muted">{m.recipe.description}</div>
                                    </div>
                                    <div className="pill accent">Match: {Math.round(m.score * 100)}</div>
                                </div>

                                <div className="cardCharacteristics">
                                    <div className="stat">
                                        <div className="statValue">
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {getCharacteristics(m.recipe).map((c) => (
                                                    <div key={c.key} className="pill">
                                                        {c.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="cardStats">
                                    <div className="stat">
                                        <div className="statLabel">Time</div>
                                        <div className="statValue">{m.recipe.timeMinutes} min</div>
                                    </div>
                                    <div className="stat">
                                        <div className="statLabel">Difficulty</div>
                                        <div className="statValue">{m.recipe.difficulty}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="statLabel">Ingredient usage</div>
                                        <div className="statValue">{m.ingredientUsagePercent}%</div>
                                    </div>
                                    <div className="stat">
                                        <div className="statLabel">Missing items</div>
                                        <div className="statValue">{m.missingRequiredCount}</div>
                                    </div>
                                </div>

                                {m.missingRequiredCount > 0 && (
                                    <div className="missing">
                                        <div className="missingLabel">Missing required:</div>
                                        <div className="missingList">{m.missingRequired.join(', ')}</div>
                                    </div>
                                )}

                                <div className="cardActions">
                                    <button className="button primary" onClick={() => props.onStartCooking(m.recipe.id)}>
                                        Start cooking
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
