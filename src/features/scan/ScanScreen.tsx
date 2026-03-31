import { useMemo, useState, useRef, useEffect } from 'react'
import type { FoodCategory, Preferences, ScanInput } from '../../types'
import { toTitleCase, normalizeIngredientName, clamp } from '../../utils/strings'
import { estimateCategory } from '../../utils/state'

const PRESETS: Array<{ id: string; label: string; items: string[] }> = [
    {
        id: 'balanced',
        label: 'Quick add: Balanced fridge',
        items: [
            'milk',
            'eggs',
            'spinach',
            'tomato',
            'cheddar cheese',
            'tortilla',
            'cooked rice',
            'soy sauce',
            'garlic',
            'frozen peas',
            'canned tuna',
        ],
    },
    {
        id: 'student',
        label: 'Quick add: Student fridge',
        items: ['pasta', 'butter', 'garlic', 'parmesan', 'bread', 'eggs'],
    },
    {
        id: 'veggie',
        label: 'Quick add: Veggie fridge',
        items: ['tofu', 'broccoli', 'bell pepper', 'soy sauce', 'cooked rice', 'lemon'],
    },
]

type DetectedRow = {
    name: string
    category?: FoodCategory
    expiresInDays?: number
}

export function ScanScreen(props: {
    preferences: Preferences
    onPreferencesChange: (prefs: Preferences) => void
    onSaveScan: (scan: ScanInput) => void
}) {
    const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
    const [rows, setRows] = useState<DetectedRow[]>([])
    const [custom, setCustom] = useState('')

    const inventoryPreview = useMemo(() => {
        return rows
            .map((r) => normalizeIngredientName(r.name))
            .filter(Boolean)
            .slice(0, 20)
    }, [rows])

    async function onPickFile(file: File | null) {
        if (!file) return
        const dataUrl = await readFileAsDataUrl(file)
        const thumb = await downscaleDataUrl(dataUrl, 800)
        setImageDataUrl(thumb)
    }

    function addPreset(presetId: string) {
        const preset = PRESETS.find((p) => p.id === presetId)
        if (!preset) return
        const next = preset.items.map((name) => ({ name: toTitleCase(name), category: estimateCategory(name) }))
        setRows(dedupeByNormalizedName([...next, ...rows]))
    }

    function addCustom() {
        const name = toTitleCase(custom)
        if (!name.trim()) return
        setRows(dedupeByNormalizedName([{ name, category: estimateCategory(name) }, ...rows]))
        setCustom('')
    }

    function updateRow(index: number, patch: Partial<DetectedRow>) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
    }

    function removeRow(index: number) {
        setRows((prev) => prev.filter((_, i) => i !== index))
    }

    const canSave = rows.some((r) => r.name.trim().length > 0)

    return (
        <div className="screen">
            <div className="screenHeader">
                <h1>Scan your fridge</h1>
                <p className="muted">Add a photo, review the ingredients we find, and save to update your fridge.</p>
            </div>

            <div className="grid2">
                <section className="panel">
                    <div className="panelTitle">1) Add a fridge photo</div>

                            <input
                                className="input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                            />

                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <CameraControls
                                    onCapture={async (dataUrl: string) => {
                                        const thumb = await downscaleDataUrl(dataUrl, 800)
                                        setImageDataUrl(thumb)
                                    }}
                                />
                            </div>

                    {imageDataUrl ? (
                        <div className="photoWrap">
                            <img className="photo" src={imageDataUrl} alt="Selected fridge" />
                        </div>
                    ) : (
                        <div className="emptyPhoto">No photo yet</div>
                    )}

                    <div className="panelTitle" style={{ marginTop: 16 }}>
                        2) Suggested ingredients
                    </div>
                    <div className="rowWrap">
                        {PRESETS.map((p) => (
                            <button key={p.id} className="button" onClick={() => addPreset(p.id)}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="panelTitle" style={{ marginTop: 16 }}>
                        3) Preferences (ranking + filtering)
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
                            <option value={0}>0 (strict)</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                        <div className="help">Recipes will be filtered to at most this many missing required ingredients.</div>
                    </div>
                </section>

                <section className="panel">
                    <div className="panelTitle">Review ingredients</div>

                    <div className="inline" style={{ gap: 8 }}>
                        <input
                            className="input"
                            placeholder="Add item (e.g., Tomato)"
                            value={custom}
                            onChange={(e) => setCustom(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addCustom()
                            }}
                        />
                        <button className="button primary" onClick={addCustom}>
                            Add
                        </button>
                    </div>

                    {rows.length === 0 ? (
                        <div className="emptyState">No items yet. Use a quick-add preset or add items manually.</div>
                    ) : (
                        <div className="list">
                            {rows.map((r, idx) => (
                                <div key={`${r.name}-${idx}`} className="listRow">
                                    <input
                                        className="input"
                                        value={r.name}
                                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                                        aria-label="Ingredient name"
                                    />
                                    <select
                                        className="select"
                                        value={r.category ?? estimateCategory(r.name)}
                                        onChange={(e) => updateRow(idx, { category: e.target.value as FoodCategory })}
                                        aria-label="Category"
                                    >
                                        <option value="produce">Produce</option>
                                        <option value="dairy">Dairy</option>
                                        <option value="meat">Meat</option>
                                        <option value="seafood">Seafood</option>
                                        <option value="pantry">Pantry</option>
                                        <option value="frozen">Frozen</option>
                                        <option value="condiment">Condiment</option>
                                        <option value="leftovers">Leftovers</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <input
                                        className="input"
                                        type="number"
                                        min={0}
                                        placeholder="Expires in (days)"
                                        value={r.expiresInDays ?? ''}
                                        onChange={(e) =>
                                            updateRow(idx, {
                                                expiresInDays: e.target.value === '' ? undefined : Number(e.target.value),
                                            })
                                        }
                                        aria-label="Expires in days"
                                    />
                                    <button className="button danger" onClick={() => removeRow(idx)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="panelFooter">
                        <div className="muted">
                            Preview: {inventoryPreview.length === 0 ? '—' : inventoryPreview.join(', ')}
                        </div>
                        <button
                            className={canSave ? 'button primary' : 'button disabled'}
                            disabled={!canSave}
                            onClick={() => {
                                props.onSaveScan({
                                    imageDataUrl,
                                    detectedItems: rows
                                        .map((r) => ({
                                            name: toTitleCase(r.name),
                                            category: r.category,
                                            expiresInDays: r.expiresInDays,
                                        }))
                                        .filter((r) => r.name.trim().length > 0),
                                })
                            }}
                        >
                            Save & find recipes
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}

function dedupeByNormalizedName(rows: DetectedRow[]): DetectedRow[] {
    const seen = new Set<string>()
    const out: DetectedRow[] = []
    for (const r of rows) {
        const n = normalizeIngredientName(r.name)
        if (!n) continue
        if (seen.has(n)) continue
        seen.add(n)
        out.push(r)
    }
    return out
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(file)
    })
}

async function downscaleDataUrl(dataUrl: string, maxSize: number): Promise<string> {
    // If anything goes wrong, fall back to original.
    try {
        const img = await loadImage(dataUrl)
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        if (scale >= 1) return dataUrl

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) return dataUrl
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg', 0.75)
    } catch {
        return dataUrl
    }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = dataUrl
    })
}

// CameraControls: small helper for in-app camera capture (mobile-friendly)
function CameraControls({ onCapture }: { onCapture: (dataUrl: string) => void }) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [active, setActive] = useState(false)

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
                streamRef.current = null
            }
        }
    }, [])

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
            setActive(true)
        } catch (err) {
            console.warn('Camera start failed', err)
            setActive(false)
        }
    }

    function stopCamera() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            try {
                videoRef.current.pause()
                videoRef.current.srcObject = null
            } catch {}
        }
        setActive(false)
    }

    async function capture() {
        if (!videoRef.current) return
        const video = videoRef.current
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) return
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        onCapture(dataUrl)
        stopCamera()
    }

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {!active ? (
                <button className="button primary" onClick={startCamera} style={{ flex: '0 0 auto' }}>
                    Use camera
                </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        style={{ width: '100%', borderRadius: 10, background: '#000' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="button primary" onClick={capture}>
                            Capture
                        </button>
                        <button className="button" onClick={stopCamera}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
