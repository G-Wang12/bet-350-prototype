import { useMemo, useState } from 'react'
import { getVisualPath } from '../../utils/visualMap'
import type { FridgeInventory, Preferences, Recipe } from '../../types'
import { suggestFromLeftovers, buildInventorySet } from '../../utils/recipeMatch'

export function CookMode(props: {
    recipe: Recipe
    inventory: FridgeInventory
    allRecipes: Recipe[]
    preferences: Preferences
    onExit: () => void
    onStartCooking: (recipeId: string) => void
}) {
    const [stepIndex, setStepIndex] = useState(0)
    const [timerRunning, setTimerRunning] = useState(false)
    const [timerRemaining, setTimerRemaining] = useState<number | null>(null)

    const invSet = useMemo(() => buildInventorySet(props.inventory), [props.inventory])

    const steps = props.recipe.steps
    const step = steps[stepIndex]
    const visualSrc = step && getVisualPath(step.instruction)

    function startTimer(seconds: number) {
        setTimerRunning(true)
        setTimerRemaining(seconds)
        const start = Date.now()
        const interval = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - start) / 1000)
            const left = Math.max(0, seconds - elapsed)
            setTimerRemaining(left)
            if (left <= 0) {
                window.clearInterval(interval)
                setTimerRunning(false)
            }
        }, 250)
    }

    const [used, setUsed] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        for (const ing of props.recipe.ingredients) {
            // Default to "used" for ingredients you actually have.
            initial[ing.normalizedName] = invSet.has(ing.normalizedName)
        }
        return initial
    })

    const usedNormalizedNames = useMemo(() => {
        return Object.entries(used)
            .filter(([, v]) => v)
            .map(([k]) => k)
    }, [used])

    const followUps = useMemo(() => {
        const ranked = suggestFromLeftovers(
            props.allRecipes.filter((r) => r.id !== props.recipe.id),
            props.inventory,
            usedNormalizedNames,
            props.preferences,
        )
        return ranked.slice(0, 4)
    }, [props.allRecipes, props.inventory, props.preferences, props.recipe.id, usedNormalizedNames])

    const isDone = stepIndex >= steps.length

    if (isDone) {
        return (
            <div className="screen">
                <div className="screenHeader">
                    <h1>Done: {props.recipe.title}</h1>
                    <p className="muted">Mark what you used to get leftover-based suggestions.</p>
                </div>

                <section className="panel">
                    <div className="panelTitle">Used ingredients</div>
                    <div className="checkList">
                        {props.recipe.ingredients.map((ing) => (
                            <label key={ing.normalizedName} className="checkRow">
                                <input
                                    type="checkbox"
                                    checked={Boolean(used[ing.normalizedName])}
                                    onChange={(e) => setUsed((s) => ({ ...s, [ing.normalizedName]: e.target.checked }))}
                                />
                                <span>
                                    {ing.name}
                                    {invSet.has(ing.normalizedName) ? '' : ' (missing)'}
                                    {ing.optional ? ' (optional)' : ''}
                                </span>
                            </label>
                        ))}
                    </div>
                </section>

                <section className="panel">
                    <div className="panelTitle">Cook next (from leftovers)</div>
                    {followUps.length === 0 ? (
                        <div className="emptyState">No follow-ups match leftovers under current filters.</div>
                    ) : (
                        <div className="cards">
                            {followUps.map((m) => (
                                <div key={m.recipe.id} className="card">
                                    <div className="cardTop">
                                        <div>
                                            <div className="cardTitle">{m.recipe.title}</div>
                                            <div className="muted">{m.recipe.timeMinutes} min • {m.recipe.difficulty}</div>
                                        </div>
                                        <div className="pill">Usage: {m.ingredientUsagePercent}%</div>
                                    </div>
                                    <div className="cardStats">
                                        <div className="stat">
                                            <div className="statLabel">Missing</div>
                                            <div className="statValue">{m.missingRequiredCount}</div>
                                        </div>
                                        <div className="stat">
                                            <div className="statLabel">Score</div>
                                            <div className="statValue">{Math.round(m.score * 100)}</div>
                                        </div>
                                    </div>
                                    <div className="cardActions">
                                        <button className="button primary" onClick={() => props.onStartCooking(m.recipe.id)}>
                                            Cook this next
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="panelFooter">
                        <button className="button" onClick={props.onExit}>
                            Back to recipes
                        </button>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="screen">
            <div className="screenHeader">
                <h1>{props.recipe.title}</h1>
                <p className="muted">
                    Step {stepIndex + 1} of {steps.length} • {props.recipe.timeMinutes} min • {props.recipe.difficulty}
                </p>
            </div>

            <section className="panel">
                <div className="cookInstruction">{step.instruction}</div>

                {step.visual && visualSrc && (
                    <div className="visual">
                        <img src={visualSrc} alt={step.visual.label} className="visualImage" />
                    </div>
                )}

                {step.visual && !visualSrc && (
                    <div className="visual emptyVisual">
                        <div className="muted">Visual guidance will appear here.</div>
                    </div>
                )}

                {step.tip && <div className="tip">Tip: {step.tip}</div>}

                {typeof step.timerSeconds === 'number' && (
                    <div className="timer">
                        <div className="timerLeft">
                            <div className="timerLabel">Timer</div>
                            <div className="timerValue">
                                {timerRemaining === null ? formatSeconds(step.timerSeconds) : formatSeconds(timerRemaining)}
                            </div>
                        </div>
                        <button
                            className="button"
                            onClick={() => startTimer(step.timerSeconds ?? 0)}
                            disabled={timerRunning}
                            title={timerRunning ? 'Timer running' : 'Start timer'}
                        >
                            {timerRunning ? 'Running…' : 'Start'}
                        </button>
                    </div>
                )}

                <div className="cookNav">
                    <button className="button" onClick={props.onExit}>
                        Exit
                    </button>
                    <div className="spacer" />
                    <button
                        className={stepIndex === 0 ? 'button disabled' : 'button'}
                        disabled={stepIndex === 0}
                        onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    >
                        Back
                    </button>
                    <button
                        className="button primary"
                        onClick={() => setStepIndex((i) => i + 1)}
                    >
                        {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </section>

            <section className="panel">
                <div className="panelTitle">Ingredients</div>
                <div className="chips">
                    {props.recipe.ingredients.map((ing) => {
                        const have = invSet.has(ing.normalizedName)
                        return (
                            <span key={ing.normalizedName} className={have ? 'chip' : 'chip missing'}>
                                {ing.name}
                                {ing.optional ? '*' : ''}
                            </span>
                        )
                    })}
                </div>
                <div className="help">* Optional ingredients don’t count as missing.</div>
            </section>
        </div>
    )
}

function formatSeconds(total: number): string {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
}
