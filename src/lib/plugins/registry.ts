import type { VyrooPlugin, InstalledPlugin, PluginSkill, PluginConnector, PluginTool } from "./types";

class PluginRegistry {
  private plugins: Map<string, VyrooPlugin> = new Map();
  private installed: Map<string, InstalledPlugin> = new Map();
  private listeners: Set<() => void> = new Set();

  /** Register a plugin definition */
  register(plugin: VyrooPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin "${plugin.id}" is already registered. Skipping.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    this.notify();
  }

  /** Unregister a plugin */
  unregister(pluginId: string): void {
    const installed = this.installed.get(pluginId);
    if (installed?.isActive) {
      this.deactivate(pluginId);
    }
    this.plugins.delete(pluginId);
    this.installed.delete(pluginId);
    this.notify();
  }

  /** Install and optionally activate a plugin */
  async install(pluginId: string, activate = true): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found in registry`);

    this.installed.set(pluginId, {
      pluginId,
      isActive: false,
      installedAt: new Date(),
      config: {},
    });

    if (activate) {
      await this.activate(pluginId);
    }
    this.notify();
  }

  /** Activate an installed plugin */
  async activate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const installed = this.installed.get(pluginId);
    if (!plugin || !installed) return;

    try {
      await plugin.onActivate?.();
      installed.isActive = true;
      this.notify();
    } catch (err) {
      console.error(`Failed to activate plugin "${pluginId}":`, err);
      throw err;
    }
  }

  /** Deactivate a plugin */
  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const installed = this.installed.get(pluginId);
    if (!plugin || !installed) return;

    try {
      await plugin.onDeactivate?.();
      installed.isActive = false;
      this.notify();
    } catch (err) {
      console.error(`Failed to deactivate plugin "${pluginId}":`, err);
    }
    this.notify();
  }

  /** Get all registered plugins */
  getAll(): VyrooPlugin[] {
    return Array.from(this.plugins.values());
  }

  /** Get a specific plugin */
  get(pluginId: string): VyrooPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /** Check if a plugin is installed and active */
  isActive(pluginId: string): boolean {
    return this.installed.get(pluginId)?.isActive ?? false;
  }

  /** Get all active plugins */
  getActive(): VyrooPlugin[] {
    return this.getAll().filter((p) => this.isActive(p.id));
  }

  /** Get all skills from active plugins */
  getActiveSkills(): PluginSkill[] {
    return this.getActive().flatMap((p) => p.skills ?? []);
  }

  /** Get all connectors from active plugins */
  getActiveConnectors(): PluginConnector[] {
    return this.getActive().flatMap((p) => p.connectors ?? []);
  }

  /** Get all tools from active plugins */
  getActiveTools(): PluginTool[] {
    return this.getActive().flatMap((p) => p.tools ?? []);
  }

  /** Subscribe to registry changes */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

// Singleton
export const pluginRegistry = new PluginRegistry();
