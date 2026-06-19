import { useMemo } from "react"
import type { ComponentType } from "react"
import { DotsIcon } from "../skins/icons"
import type { MenuItemState, MenuNode } from "../menu/menuData"
import { SEICanvasActionMenu } from "./SEICanvasActionMenu"

/**
 * A declarative row/face action. `onSelect` fires for leaf actions; provide
 * `children` to nest a submenu instead (its `onSelect` is then ignored). New
 * actions are added by appending to the `actions` array — no row/menu rewrite.
 */
export interface ArcAction {
    id: string
    label: string
    /** Optional glyph; defaults to the three-dot mark. */
    icon?: ComponentType
    /** Reuses the arc menu's state union (available/disabled/locked/…). */
    state?: MenuItemState
    /** Leaf handler. Receives the action id; ignored when `children` is set. */
    onSelect?: (id: string) => void
    /** Nested actions — renders a submenu in the arc. */
    children?: ArcAction[]
}

export interface ArcActionButtonProps {
    /** The actions to surface in the arc. */
    actions: ArcAction[]
    ariaLabel?: string
    className?: string
}

/** Map the declarative action tree onto the arc menu's `MenuNode` tree. */
function toMenuNodes(actions: ArcAction[]): MenuNode[] {
    return actions.map((a) => ({
        id: a.id,
        label: a.label,
        icon: a.icon ?? DotsIcon,
        state: a.state,
        // No `actionId`: leaf selections fall through to the menu's `onSelect`,
        // which we dispatch by id — keeping this fully decoupled from the
        // reserved queue/canvas actions. An empty `children` array stays
        // `undefined` so the node renders as a leaf (matching `indexLeaves`),
        // not a submenu that opens nothing.
        children:
            a.children && a.children.length > 0
                ? toMenuNodes(a.children)
                : undefined,
    }))
}

/** Flatten leaf actions into an id → action map for O(1) dispatch. */
function indexLeaves(actions: ArcAction[], map: Map<string, ArcAction>): void {
    for (const a of actions) {
        if (a.children && a.children.length > 0) indexLeaves(a.children, map)
        else map.set(a.id, a)
    }
}

/**
 * A generic Arc Action Button: the SEIHouse command-wheel affordance backed by a
 * plain `ArcAction[]` model. It is a thin, engine-agnostic adapter over
 * `SEICanvasActionMenu` — the trigger is a single button when closed (cheap to
 * mount in long lists), and the arc overlay only renders on tap. Any face can
 * reuse it as its primary action surface; Vault rows use it in place of the old
 * three-dot menu.
 */
export function ArcActionButton({
    actions,
    ariaLabel = "Actions",
    className,
}: ArcActionButtonProps) {
    const items = useMemo(() => toMenuNodes(actions), [actions])
    const leaves = useMemo(() => {
        const map = new Map<string, ArcAction>()
        indexLeaves(actions, map)
        return map
    }, [actions])

    return (
        <SEICanvasActionMenu
            items={items}
            onSelect={(node) => leaves.get(node.id)?.onSelect?.(node.id)}
            ariaLabel={ariaLabel}
            className={className}
        />
    )
}

export default ArcActionButton
