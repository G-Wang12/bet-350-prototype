import './App.css'

import { useEffect, useMemo, useState } from 'react'
import { CookMode } from './features/cook/CookMode'
import { FridgeScreen } from './features/fridge/FridgeScreen'
import { RecipesScreen } from './features/recipes/RecipesScreen'
import { ScanScreen } from './features/scan/ScanScreen'
import type { AppState, Recipe } from './types'
import {
  addOrUpdateInventoryFromScan,
  computeReminders,
  createSnapshotFromScan,
  defaultAppState,
  loadState,
  saveState,
} from './utils/state'

function App() {
  const [tab, setTab] = useState<'scan' | 'fridge' | 'recipes' | 'cook'>('scan')
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultAppState())
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const reminders = useMemo(() => computeReminders(state.inventory), [state.inventory])
  const activeRecipe: Recipe | undefined = useMemo(() => {
    if (!activeRecipeId) return undefined
    return state.recipes.find((r) => r.id === activeRecipeId)
  }, [activeRecipeId, state.recipes])

  return (
    <div className="appRoot">
      <header className="appHeader">
        <div className="headerRow">
          <div className="brand">
            <div className="brandTitle">Fridge-to-Meal Prototype</div>
            <div className="brandSub">Scan your fridge → get 20-minute recipes</div>
          </div>
          <div className="headerMeta">
            <div className="pill">Items: {state.inventory.items.length}</div>
            <div className="pill">Reminders: {reminders.length}</div>
          </div>
        </div>

        <nav className="tabs" aria-label="Primary navigation">
          <button className={tab === 'scan' ? 'tab active' : 'tab'} onClick={() => setTab('scan')}>
            Scan
          </button>
          <button className={tab === 'fridge' ? 'tab active' : 'tab'} onClick={() => setTab('fridge')}>
            Fridge
          </button>
          <button className={tab === 'recipes' ? 'tab active' : 'tab'} onClick={() => setTab('recipes')}>
            Recipes
          </button>
          <button
            className={tab === 'cook' ? 'tab active' : 'tab'}
            onClick={() => setTab('cook')}
            disabled={!activeRecipe}
            title={activeRecipe ? 'Continue cooking' : 'Pick a recipe first'}
          >
            Cook
          </button>
        </nav>
      </header>

      <main className="appMain">
        {tab === 'scan' && (
          <ScanScreen
            preferences={state.preferences}
            onPreferencesChange={(prefs) => setState((s) => ({ ...s, preferences: prefs }))}
            onSaveScan={(scan) => {
              const snapshot = createSnapshotFromScan(scan)
              setState((s) => {
                const nextInventory = addOrUpdateInventoryFromScan(s.inventory, scan)
                return {
                  ...s,
                  inventory: nextInventory,
                  snapshots: [snapshot, ...s.snapshots].slice(0, 25),
                }
              })
              setTab('recipes')
            }}
          />
        )}

        {tab === 'fridge' && (
          <FridgeScreen
            inventory={state.inventory}
            reminders={reminders}
            snapshots={state.snapshots}
            onInventoryChange={(inv) => setState((s) => ({ ...s, inventory: inv }))}
            onClearAll={() => setState(defaultAppState())}
          />
        )}

        {tab === 'recipes' && (
          <RecipesScreen
            inventory={state.inventory}
            preferences={state.preferences}
            recipes={state.recipes}
            onPreferencesChange={(prefs) => setState((s) => ({ ...s, preferences: prefs }))}
            onStartCooking={(recipeId) => {
              setActiveRecipeId(recipeId)
              setTab('cook')
            }}
          />
        )}

        {tab === 'cook' && activeRecipe && (
          <CookMode
            recipe={activeRecipe}
            inventory={state.inventory}
            allRecipes={state.recipes}
            preferences={state.preferences}
            onExit={() => setTab('recipes')}
            onStartCooking={(recipeId) => {
              setActiveRecipeId(recipeId)
              setTab('cook')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
