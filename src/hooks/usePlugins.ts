import { useCallback, useSyncExternalStore } from "react";
import { pluginRegistry } from "@/lib/plugins/registry";
import type { VyrooPlugin, PluginSkill, PluginConnector, PluginTool } from "@/lib/plugins/types";

/** Subscribe to all registered plugins */
export function usePlugins(): VyrooPlugin[] {
  return useSyncExternalStore(
    (cb) => pluginRegistry.subscribe(cb),
    () => pluginRegistry.getAll()
  );
}

/** Subscribe to active plugins only */
export function useActivePlugins(): VyrooPlugin[] {
  return useSyncExternalStore(
    (cb) => pluginRegistry.subscribe(cb),
    () => pluginRegistry.getActive()
  );
}

/** Get aggregated skills from all active plugins */
export function usePluginSkills(): PluginSkill[] {
  return useSyncExternalStore(
    (cb) => pluginRegistry.subscribe(cb),
    () => pluginRegistry.getActiveSkills()
  );
}

/** Get aggregated connectors from all active plugins */
export function usePluginConnectors(): PluginConnector[] {
  return useSyncExternalStore(
    (cb) => pluginRegistry.subscribe(cb),
    () => pluginRegistry.getActiveConnectors()
  );
}

/** Get aggregated tools from all active plugins */
export function usePluginTools(): PluginTool[] {
  return useSyncExternalStore(
    (cb) => pluginRegistry.subscribe(cb),
    () => pluginRegistry.getActiveTools()
  );
}

/** Hook for plugin installation/activation management */
export function usePluginManager() {
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

  return { install, uninstall, activate, deactivate, isActive };
}
