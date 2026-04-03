import { useMemo, useState } from 'react'
import type { FridgeInventory, FridgeSnapshot, Reminder, FoodCategory } from '../../types'
import { estimateCategory } from '../../utils/state'
import { normalizeIngredientName, toTitleCase } from '../../utils/strings'
import { uid } from '../../utils/id'

export function FridgeScreen(props: {
    inventory: FridgeInventory
    reminders: Reminder[]
    snapshots: FridgeSnapshot[]
    onInventoryChange: (inv: FridgeInventory) => void
    onClearAll: () => void
}) {
    const [newItem, setNewItem] = useState('')

    const items = props.inventory.items

    const snapshotsToShow = useMemo(() => props.snapshots.slice(0, 8), [props.snapshots])

    function addItem() {
        const name = toTitleCase(newItem)
        const normalizedName = normalizeIngredientName(name)
        if (!normalizedName) return

        if (items.some((i) => i.normalizedName === normalizedName)) {
            setNewItem('')
            return
        }

        const nowIso = new Date().toISOString()

        props.onInventoryChange({
            items: [
                {
                    id: uid('inv'),
                    name,
                    normalizedName,
                    category: estimateCategory(name),
                    addedAtIso: nowIso,
                    lastSeenAtIso: nowIso,
                },
                ...items,
            ].sort((a, b) => a.name.localeCompare(b.name)),
        })
        setNewItem('')
    }

    function updateItem(id: string, patch: Partial<(typeof items)[number]>) {
        props.onInventoryChange({
            items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })
    }

    function removeItem(id: string) {
        props.onInventoryChange({ items: items.filter((i) => i.id !== id) })
    }

    return (
        <div className="screen">
            <div className="screenHeader">
                <h1>Your fridge</h1>
                <p className="muted">Saved on this device.</p>
            </div>

            {props.reminders.length > 0 && (
                <section className="panel">
                    <div className="panelTitle">Reminders</div>
                    <div className="list">
                        {props.reminders.map((r) => (
                            <div key={r.itemId} className="reminderRow">
                                <div className="reminderMain">
                                    <div className="reminderTitle">{r.itemName}</div>
                                    <div className="muted">
                                        {r.daysLeft <= 0
                                            ? 'Expired'
                                            : r.daysLeft === 1
                                                ? '1 day left'
                                                : `${r.daysLeft} days left`}
                                    </div>
                                </div>
                                <div className={r.severity === 'urgent' ? 'pill urgent' : 'pill soon'}>
                                    {r.severity === 'urgent' ? 'Urgent' : 'Soon'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid2">
                <section className="panel">
                    <div className="panelTitle">Inventory</div>

                    <div className="inline" style={{ gap: 8 }}>
                        <input
                            className="input"
                            placeholder="Add item (e.g., Cucumber)"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addItem()
                            }}
                        />
                        <button className="button primary" onClick={addItem}>
                            Add
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="emptyState">No items yet. Scan ingredients to get started.</div>
                    ) : (
                        <div className="list">
                            <div className="listHeader" role="row">
                                <div className="listHeaderCell">Item</div>
                                <div className="listHeaderCell">Category</div>
                                <div className="listHeaderCell">Expiry</div>
                                <div className="listHeaderCell" aria-hidden="true" />
                            </div>
                            {items.map((i) => (
                                <div key={i.id} className="listRow">
                                    <input
                                        className="input"
                                        value={i.name}
                                        onChange={(e) =>
                                            updateItem(i.id, {
                                                name: e.target.value,
                                                normalizedName: normalizeIngredientName(e.target.value),
                                            })
                                        }
                                        aria-label="Item name"
                                    />
                                    <select
                                        className="select"
                                        value={i.category}
                                        onChange={(e) => updateItem(i.id, { category: e.target.value as FoodCategory })}
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
                                        type="date"
                                        value={i.expiresAtIso ? i.expiresAtIso.slice(0, 10) : ''}
                                        onChange={(e) =>
                                            updateItem(i.id, {
                                                expiresAtIso: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                            })
                                        }
                                        aria-label="Expiry date"
                                    />
                                    <button className="button danger" onClick={() => removeItem(i.id)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="panelFooter">
                        <div className="muted">Tip: set expiry dates to see reminders.</div>
                        <button className="button danger" onClick={props.onClearAll}>
                            Reset all saved data
                        </button>
                    </div>
                </section>

                <section className="panel">
                    <div className="panelTitle">Recent scans</div>
                    {snapshotsToShow.length === 0 ? (
                        <div className="emptyState">No scans yet.</div>
                    ) : (
                        <div className="snapGrid">
                            {snapshotsToShow.map((s) => (
                                <div key={s.id} className="snapCard">
                                    {s.thumbnailDataUrl ? (
                                        <img className="snapThumb" src={s.thumbnailDataUrl} alt="Fridge scan thumbnail" />
                                    ) : (
                                        <div className="snapThumb empty">No image</div>
                                    )}
                                    <div className="snapMeta">
                                        <div className="snapDate">{new Date(s.createdAtIso).toLocaleString()}</div>
                                        <div className="muted">{s.items.length} items</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
