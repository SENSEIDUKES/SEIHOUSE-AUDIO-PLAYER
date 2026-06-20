import { ComponentType } from 'react';
import { MenuItemState } from '../menu/menuData';
/**
 * A declarative row/face action. `onSelect` fires for leaf actions; provide
 * `children` to nest a submenu instead (its `onSelect` is then ignored). New
 * actions are added by appending to the `actions` array — no row/menu rewrite.
 */
export interface ArcAction {
    id: string;
    label: string;
    /** Optional glyph; defaults to the three-dot mark. */
    icon?: ComponentType;
    /** Reuses the arc menu's state union (available/disabled/locked/…). */
    state?: MenuItemState;
    /** Leaf handler. Receives the action id; ignored when `children` is set. */
    onSelect?: (id: string) => void;
    /** Nested actions — renders a submenu in the arc. */
    children?: ArcAction[];
}
export interface ArcActionButtonProps {
    /** The actions to surface in the arc. */
    actions: ArcAction[];
    ariaLabel?: string;
    className?: string;
}
/**
 * A generic Arc Action Button: the SEIHouse command-wheel affordance backed by a
 * plain `ArcAction[]` model. It is a thin, engine-agnostic adapter over
 * `SEICanvasActionMenu` — the trigger is a single button when closed (cheap to
 * mount in long lists), and the arc overlay only renders on tap. Any face can
 * reuse it as its primary action surface; Vault rows use it in place of the old
 * three-dot menu.
 */
export declare function ArcActionButton({ actions, ariaLabel, className, }: ArcActionButtonProps): import("react").JSX.Element;
export default ArcActionButton;
//# sourceMappingURL=ArcActionButton.d.ts.map