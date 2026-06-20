import { WorkspaceRoute } from '../components/workspace/workspaceRoutes';
import { UsePlayerSurfaceResult } from './usePlayerSurface';
export interface PlayerSurfaceButtonsProps {
    surface: UsePlayerSurfaceResult;
    /** Left (canvas) button. Defaults to the face's declared canvas support. */
    showCanvasButton?: boolean;
    /**
     * Right (action menu) trigger — the contextual radial menu. Defaults to the
     * face's declared `supportsContextualActions` capability, so it is the model,
     * not this component, that decides whether the menu appears.
     */
    showQueueButton?: boolean;
    /**
     * What the menu's "Up Next" leaf opens. Faces with a full queue drawer pass
     * their opener here; the default falls back to the in-region queue toggle so
     * faces without a drawer (e.g. mini sidebar) still reach their queue.
     */
    onOpenQueue?: () => void;
    /**
     * Add Previous/Next leaves to the menu's Playback branch. Compact faces that
     * drop their inline skip buttons (the mini sidebar) opt in and wire
     * `onPrevious`/`onNext`, moving transport into the menu so the row has space
     * for title/artist.
     */
    showTransport?: boolean;
    canPrevious?: boolean;
    canNext?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
    /**
     * Callback when a workspace route is selected from the arc menu. The parent
     * face should manage a single SAPController instance and update its route.
     * This component no longer owns/renders a separate SAPController.
     */
    onOpenFocusedController?: (route: WorkspaceRoute) => void;
    className?: string;
}
/**
 * The shared left/right surface controls. LEFT reveals the SEICanvas (only on
 * faces that support it). RIGHT is the SEI Canvas Action Menu — a bottom-arc
 * command wheel that replaces the old flat "Up Next" toggle. Queue lives inside
 * it under Playback › Up Next; the canvas under Plugin › Visual › Canvas.
 */
export declare function PlayerSurfaceButtons({ surface, showCanvasButton, showQueueButton, onOpenQueue, showTransport, canPrevious, canNext, onPrevious, onNext, onOpenFocusedController, className, }: PlayerSurfaceButtonsProps): import("react").JSX.Element | null;
export default PlayerSurfaceButtons;
//# sourceMappingURL=PlayerSurfaceButtons.d.ts.map