import { useCallback, useSyncExternalStore } from "react";
import { pluginRegistry } from "../lib/plugins/registry";
import type {
  VyrooPlugin,
  PluginSkill,
  PluginConnector,
  PluginTool,
} from "../lib/plugins/types";

// Stable subscribe reference — useSyncExternalStore requires a referentially
// stable subscribe function to avoid re-subscribing on every render.
const subscribe = (onStoreChange: () => void) =>
  pluginRegistry.subscribe(onStoreChange);

/**
 * Primary hook that bridges the plugin registry with React state.
 * Uses useSyncExternalStore for concurrent-mode safe subscription.
 */
export function usePlugins() {
  const plugins = useSyncExternalStore(
    subscribe,
    () => pluginRegistry.getAll(),
    () => pluginRegistry.getAll()
  );

  const activePlugins = useSyncExternalStore(
    subscribe,
    () => pluginRegistry.getActive(),
    () => pluginRegistry.getActive()
  );

  const install = useCallback(async (pluginId: string) => {
    await pluginRegistry.install(pluginId);
  }, []);

  const uninstall = useCallback((pluginId: string) => {
    pluginRegistry.unregister(pluginId);
  }, []);

  const activate = useCallback(async (pluginId: string) => {
    await pluginRegistry.activate(pluginId);
  }, []);

  const deactivate = useCallback(async (pluginId: string) => {
    await pluginRegistry.deactivate(pluginId);
  }, []);

  const isActive = useCallback((pluginId: string): boolean => {
    return pluginRegistry.isActive(pluginId);
  }, []);

  return { plugins, activePlugins, install, uninstall, activate, deactivate, isActive };
}

/** Returns all skills from active plugins. */
export function usePluginSkills(): PluginSkill[] {
  return useSyncExternalStore(
    subscribe,
    () => pluginRegistry.getActiveSkills(),
    () => pluginRegistry.getActiveSkills()
  );
}

/** Returns all connectors from active plugins. */
export function usePluginConnectors(): PluginConnector[] {
  return useSyncExternalStore(
    subscribe,
    () => pluginRegistry.getActiveConnectors(),
    () => pluginRegistry.getActiveConnectors()
  );
}

/** Returns all tools from active plugins. */
export function usePluginTools(): PluginTool[] {
  return useSyncExternalStore(
    subscribe,
    () => pluginRegistry.getActiveTools(),
    () => pluginRegistry.getActiveTools()
  );
}
