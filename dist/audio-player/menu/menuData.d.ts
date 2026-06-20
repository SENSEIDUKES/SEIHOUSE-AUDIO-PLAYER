import { ComponentType } from 'react';
import { WorkspaceRoute } from '../components/workspace/workspaceRoutes';
/**
 * Visual/behavioral state of a single menu node. These map to distinct stylings
 * in the arc and decide whether the node is interactive.
 *
 * - `active`      — currently on (accent ring/glow), still tappable to toggle off
 * - `available`   — ready to use (glass), the default
 * - `inactive`    — available but not selected; dimmed glass, tappable no-op for V1
 * - `disabled`    — not usable in this context (e.g. canvas on a face without it)
 * - `locked`      — gated behind an entitlement; shows a lock, not interactive
 * - `coming-soon` — placeholder for a future capability; "soon" badge, not interactive
 */
export type MenuItemState = "active" | "available" | "inactive" | "disabled" | "locked" | "coming-soon";
/** Known leaf actions the host resolves to real callbacks. Open string union so
 *  the tree can carry future action ids without a type change. */
export type MenuActionId = "open-queue" | "activate-canvas" | "select-lyrics" | "previous-track" | "next-track" | "open-activity-log" | (string & {});
/**
 * A node in the SEI Canvas Action Menu tree. Either a branch (has `children`,
 * pushes a submenu) or a leaf (has an `actionId`, resolves to a host callback).
 * Deliberately free of any engine/session imports so the arc renderer and this
 * data model can later be promoted into the seihouse-ui design system.
 */
export interface MenuNode {
    id: string;
    label: string;
    /** Icon component rendered as `<Icon />` inside the node button. */
    icon: ComponentType;
    /** Defaults to `"available"` when omitted. */
    state?: MenuItemState;
    /** Branch: entering this node opens a submenu of `children`. */
    children?: MenuNode[];
    /** Leaf: resolved against host callbacks (e.g. `"open-queue"`). */
    actionId?: MenuActionId;
    /**
     * Leaf: the focused workspace this node opens in the SAP Controller shell.
     * When the host wires `onOpenWorkspace`, this takes precedence over the
     * legacy `actionId`; without it the node falls back to `actionId`, so the
     * field is additive and backward compatible.
     */
    workspaceRoute?: WorkspaceRoute;
}
export interface BuildMenuTreeOptions {
    /** Whether the current face can host the SEICanvas. Disables the Canvas node. */
    canvasSupported: boolean;
    /** Whether the canvas surface is currently open (marks Canvas as `active`). */
    isCanvasActive: boolean;
    /**
     * Add Previous/Next transport leaves under Playback. Compact faces that drop
     * their inline skip buttons (e.g. the mini sidebar) opt in so skip/next moves
     * into the menu, freeing the row for title/artist. Defaults to off, so faces
     * with their own transport controls (fullCard) keep the menu uncluttered.
     */
    includeTransport?: boolean;
    /** Whether previous/next are currently available (gates the transport leaves). */
    canPrevious?: boolean;
    canNext?: boolean;
}
/**
 * The V1 hardcoded menu tree. A builder (not a constant) so per-face capability
 * and live surface state can adjust node states without the arc knowing about
 * the player. Replaceable later by a plugin-registry-driven tree of the same shape.
 */
export declare function buildMenuTree({ canvasSupported, isCanvasActive, includeTransport, canPrevious, canNext, }: BuildMenuTreeOptions): MenuNode[];
/** Whether a node can be interacted with (entered or actioned). */
export declare function isNodeInteractive(node: MenuNode): boolean;
//# sourceMappingURL=menuData.d.ts.map