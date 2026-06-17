import type { ComponentType } from "react"
import {
    isWorkspaceRoute,
    type WorkspaceRoute,
} from "../components/workspace/workspaceRoutes"
import {
    getPluginCanvasSurfaceId,
    getPluginSettingsRoute,
    isHeadlessPlugin,
} from "../plugins/surfaces/pluginSurfaceHelpers"
import { getPluginSurfaceDefinitionsForMenuBranch } from "../plugins/surfaces/defaultPluginSurfaces"
import type { PluginSurfaceDefinition } from "../plugins/surfaces/pluginSurfaceTypes"
import {
    AgentIcon,
    AnalyticsIcon,
    AutomixIcon,
    LyricsIcon,
    NextIcon,
    PlaybackIcon,
    PluginIcon,
    PrevIcon,
    QueueIcon,
    RepeatIcon,
    VisualIcon,
    WaveIcon,
} from "../skins/icons"

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
export type MenuItemState =
    | "active"
    | "available"
    | "inactive"
    | "disabled"
    | "locked"
    | "coming-soon"

/** Known leaf actions the host resolves to real callbacks. Open string union so
 *  the tree can carry future action ids without a type change. */
export type MenuActionId =
    | "open-queue"
    | "activate-canvas"
    | "select-lyrics"
    | "previous-track"
    | "next-track"
    | (string & {})

/**
 * A node in the SEI Canvas Action Menu tree. Either a branch (has `children`,
 * pushes a submenu) or a leaf (has an `actionId`, resolves to a host callback).
 * Deliberately free of any engine/session imports so the arc renderer and this
 * data model can later be promoted into the seihouse-ui design system.
 */
export interface MenuNode {
    id: string
    label: string
    /** Icon component rendered as `<Icon />` inside the node button. */
    icon: ComponentType
    /** Defaults to `"available"` when omitted. */
    state?: MenuItemState
    /** Branch: entering this node opens a submenu of `children`. */
    children?: MenuNode[]
    /** Leaf: resolved against host callbacks (e.g. `"open-queue"`). */
    actionId?: MenuActionId
    /**
     * Leaf: the focused workspace this node opens in the SAP Controller shell.
     * When the host wires `onOpenWorkspace`, this takes precedence over the
     * legacy `actionId`; without it the node falls back to `actionId`, so the
     * field is additive and backward compatible.
     */
    workspaceRoute?: WorkspaceRoute
    /**
     * Leaf: the plugin SEI Canvas surface this node activates (e.g. `"lyrics"`).
     * When the host wires `onActivateCanvasSurface`, this takes precedence over
     * `workspaceRoute`/`actionId`, so a canvas plugin opens inside SEI Canvas
     * rather than a settings workspace. Additive and backward compatible.
     */
    canvasSurfaceId?: string
}

export interface BuildMenuTreeOptions {
    /** Whether the current face can host the SEICanvas. Disables canvas nodes. */
    canvasSupported: boolean
    /**
     * Retained for backward compatibility. The generic Canvas node was replaced
     * by per-plugin canvas nodes (see `activeCanvasSurfaceId`); this flag no
     * longer affects the tree.
     */
    isCanvasActive?: boolean
    /**
     * Add Previous/Next transport leaves under Playback. Compact faces that drop
     * their inline skip buttons (e.g. the mini sidebar) opt in so skip/next moves
     * into the menu, freeing the row for title/artist. Defaults to off, so faces
     * with their own transport controls (fullCard) keep the menu uncluttered.
     */
    includeTransport?: boolean
    /** Whether previous/next are currently available (gates the transport leaves). */
    canPrevious?: boolean
    canNext?: boolean
    /**
     * Id of the plugin canvas surface currently open (e.g. "lyrics"), used to
     * mark its node `active`. Omitted/null means no plugin canvas is open.
     */
    activeCanvasSurfaceId?: string | null
}

/** Per-plugin icon for derived menu nodes; falls back to the generic PluginIcon. */
const PLUGIN_MENU_ICONS: Record<string, ComponentType> = {
    lyrics: LyricsIcon,
    waveform: WaveIcon,
    "auto-theme": VisualIcon,
    automix: AutomixIcon,
    "sleep-timer": PlaybackIcon,
    analytics: AnalyticsIcon,
}

/**
 * Convert a surface definition into a menu leaf. Canvas/dual plugins become
 * canvas-activation nodes (the primary action) and keep their settings
 * `workspaceRoute` as a fallback for hosts that don't wire
 * `onActivateCanvasSurface`. Settings-only plugins become workspace-route nodes
 * when their route is registered, else a disabled placeholder. Headless plugins
 * produce no node.
 */
function pluginSurfaceNode(
    def: PluginSurfaceDefinition,
    canvasSupported: boolean,
    activeCanvasSurfaceId: string | null
): MenuNode | null {
    if (isHeadlessPlugin(def)) return null
    const icon = PLUGIN_MENU_ICONS[def.pluginId] ?? PluginIcon

    const route = getPluginSettingsRoute(def)
    const workspaceRoute = route && isWorkspaceRoute(route) ? route : undefined

    const surfaceId = getPluginCanvasSurfaceId(def)
    if (surfaceId) {
        const state: MenuItemState = !canvasSupported
            ? "disabled"
            : activeCanvasSurfaceId === surfaceId
              ? "active"
              : "available"
        // canvasSurfaceId is the primary action; workspaceRoute is the fallback
        // (SEICanvasActionMenu prefers canvas activation when the host wires it).
        return {
            id: def.pluginId,
            label: def.label,
            icon,
            state,
            canvasSurfaceId: surfaceId,
            workspaceRoute,
        }
    }

    if (workspaceRoute) {
        return {
            id: def.pluginId,
            label: def.label,
            icon,
            workspaceRoute,
        }
    }
    // Settings plugin without a registered route: show it but keep it inert.
    return { id: def.pluginId, label: def.label, icon, state: "disabled" }
}

/** Build a sub-branch from the plugins assigned to a menu branch. */
function pluginBranchNodes(
    defs: PluginSurfaceDefinition[],
    canvasSupported: boolean,
    activeCanvasSurfaceId: string | null
): MenuNode[] {
    return defs
        .map((def) => pluginSurfaceNode(def, canvasSupported, activeCanvasSurfaceId))
        .filter((node): node is MenuNode => node !== null)
}

/**
 * The menu tree. Plugin branches are derived from `DEFAULT_PLUGIN_SURFACES` so
 * the surface routing contract is the single source of truth for where plugins
 * appear; the transport/playback and agent branches stay hardcoded. A builder
 * (not a constant) so per-face capability and live surface state adjust node
 * states without the arc knowing about the player.
 */
export function buildMenuTree({
    canvasSupported,
    includeTransport = false,
    canPrevious = false,
    canNext = false,
    activeCanvasSurfaceId = null,
}: BuildMenuTreeOptions): MenuNode[] {
    const transportNodes: MenuNode[] = includeTransport
        ? [
              {
                  id: "previous-track",
                  label: "Previous",
                  icon: PrevIcon,
                  state: canPrevious ? "available" : "disabled",
                  actionId: "previous-track",
              },
              {
                  id: "next-track",
                  label: "Next",
                  icon: NextIcon,
                  state: canNext ? "available" : "disabled",
                  actionId: "next-track",
              },
          ]
        : []

    // Plugin sub-branches, derived from the surface catalog.
    const visualNodes = pluginBranchNodes(
        getPluginSurfaceDefinitionsForMenuBranch("plugin:visual"),
        canvasSupported,
        activeCanvasSurfaceId
    )
    // Automix keeps its dedicated spot under the top-level Playback branch, so
    // it is excluded here to avoid surfacing it twice.
    const pluginPlaybackNodes = pluginBranchNodes(
        getPluginSurfaceDefinitionsForMenuBranch("playback").filter(
            (def) => def.pluginId !== "automix"
        ),
        canvasSupported,
        activeCanvasSurfaceId
    )
    const analyticsNodes = pluginBranchNodes(
        getPluginSurfaceDefinitionsForMenuBranch("plugin:analytics"),
        canvasSupported,
        activeCanvasSurfaceId
    )

    const pluginChildren: MenuNode[] = []
    if (visualNodes.length > 0) {
        pluginChildren.push({
            id: "visual",
            label: "Visual",
            icon: VisualIcon,
            children: visualNodes,
        })
    }
    if (pluginPlaybackNodes.length > 0) {
        pluginChildren.push({
            id: "plugin-playback",
            label: "Playback",
            icon: PlaybackIcon,
            children: pluginPlaybackNodes,
        })
    }
    if (analyticsNodes.length > 0) {
        pluginChildren.push({
            id: "plugin-analytics",
            label: "Analytics",
            icon: AnalyticsIcon,
            children: analyticsNodes,
        })
    }

    return [
        {
            id: "plugin",
            label: "Plugin",
            icon: PluginIcon,
            children: pluginChildren,
        },
        {
            id: "playback",
            label: "Playback",
            icon: PlaybackIcon,
            children: [
                ...transportNodes,
                {
                    id: "up-next",
                    label: "Up Next",
                    icon: QueueIcon,
                    actionId: "open-queue",
                    workspaceRoute: "library:queue",
                },
                {
                    id: "automix",
                    label: "Automix",
                    icon: AutomixIcon,
                    state: "coming-soon",
                    workspaceRoute: "playback:automix",
                },
                {
                    id: "repeat",
                    label: "Repeat",
                    icon: RepeatIcon,
                    state: "coming-soon",
                },
            ],
        },
        {
            id: "agent",
            label: "Agent",
            icon: AgentIcon,
            state: "coming-soon",
            workspaceRoute: "agent:queue-director",
        },
    ]
}

/** Whether a node can be interacted with (entered or actioned). */
export function isNodeInteractive(node: MenuNode): boolean {
    const state = node.state ?? "available"
    return state !== "disabled" && state !== "locked" && state !== "coming-soon"
}
