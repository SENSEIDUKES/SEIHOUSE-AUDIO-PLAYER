import { useMemo } from "react"
import { CanvasIcon } from "../skins/icons"
import { SurfaceButton } from "./SurfaceButton"
import { SEICanvasActionMenu } from "./SEICanvasActionMenu"
import { buildMenuTree } from "../menu/menuData"
import type { MenuNode } from "../menu/menuData"
import type { UsePlayerSurfaceResult } from "./usePlayerSurface"

export interface PlayerSurfaceButtonsProps {
    surface: UsePlayerSurfaceResult
    /** Left (canvas) button. Defaults to the face's declared canvas support. */
    showCanvasButton?: boolean
    /**
     * Right (action menu) trigger — the contextual radial menu. Defaults to the
     * face's declared `supportsContextualActions` capability, so it is the model,
     * not this component, that decides whether the menu appears.
     */
    showQueueButton?: boolean
    /**
     * What the menu's "Up Next" leaf opens. Faces with a full queue drawer pass
     * their opener here; the default falls back to the in-region queue toggle so
     * faces without a drawer (e.g. mini sidebar) still reach their queue.
     */
    onOpenQueue?: () => void
    className?: string
}

/**
 * The shared left/right surface controls. LEFT reveals the SEICanvas (only on
 * faces that support it). RIGHT is the SEI Canvas Action Menu — a bottom-arc
 * command wheel that replaces the old flat "Up Next" toggle. Queue lives inside
 * it under Playback › Up Next; the canvas under Plugin › Visual › Canvas.
 */
export function PlayerSurfaceButtons({
    surface,
    showCanvasButton = surface.canvasSupported,
    showQueueButton = surface.contextualSupported,
    onOpenQueue,
    className,
}: PlayerSurfaceButtonsProps) {
    // Built only when the contextual menu is actually rendered, and memoized so
    // it isn't rebuilt on every parent playback tick (skins re-render multiple
    // times per second during active playback). Hooks must run before the early
    // return below, so this stays unconditional.
    const menuItems = useMemo<MenuNode[]>(
        () =>
            showQueueButton
                ? buildMenuTree({
                      canvasSupported: surface.canvasSupported,
                      isCanvasActive: surface.isCanvasOpen,
                  })
                : [],
        [showQueueButton, surface.canvasSupported, surface.isCanvasOpen]
    )
    if (!showCanvasButton && !showQueueButton) return null
    return (
        <div
            className={`ap-surface-actions${className ? ` ${className}` : ""}`}
            role="group"
            aria-label="Player surfaces"
        >
            {/* Static label: aria-pressed (on SurfaceButton) communicates the
                toggle state, so the label must not also change with state. */}
            {showCanvasButton && (
                <SurfaceButton
                    active={surface.isCanvasOpen}
                    onClick={surface.toggleCanvas}
                    label="SEI Canvas"
                >
                    <CanvasIcon />
                </SurfaceButton>
            )}
            {showQueueButton && (
                <SEICanvasActionMenu
                    items={menuItems}
                    onActivateCanvas={surface.toggleCanvas}
                    onOpenQueue={onOpenQueue ?? surface.toggleQueue}
                />
            )}
        </div>
    )
}

export default PlayerSurfaceButtons
