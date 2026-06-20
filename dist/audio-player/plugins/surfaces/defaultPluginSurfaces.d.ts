import { PluginSurfaceCategory, PluginMenuBranch, PluginSurfaceDefinition } from './pluginSurfaceTypes';
export declare const DEFAULT_PLUGIN_SURFACES: readonly PluginSurfaceDefinition[];
/** Look up a single plugin's surface definition by its plugin id. */
export declare function getPluginSurfaceDefinition(pluginId: string): PluginSurfaceDefinition | undefined;
/** All surface definitions in a given category, sorted by menu order. */
export declare function getPluginSurfaceDefinitionsByCategory(category: PluginSurfaceCategory): PluginSurfaceDefinition[];
/** All surface definitions whose menu placement targets a given branch, sorted. */
export declare function getPluginSurfaceDefinitionsForMenuBranch(branch: PluginMenuBranch): PluginSurfaceDefinition[];
//# sourceMappingURL=defaultPluginSurfaces.d.ts.map