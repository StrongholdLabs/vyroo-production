import type { VyrooPlugin } from "./types";
import { pluginRegistry } from "./registry";

/**
 * Loads and registers plugins. In production, this would dynamically
 * import plugin modules. For now it handles static registration.
 */
export async function loadPlugins(plugins: VyrooPlugin[]): Promise<void> {
  for (const plugin of plugins) {
    pluginRegistry.register(plugin);
  }
}

/**
 * Auto-installs all registered plugins that match the given vertical.
 * Used during workspace initialization.
 */
export async function activateVertical(vertical: string): Promise<void> {
  const plugins = pluginRegistry.getAll().filter((p) => p.vertical === vertical);

  for (const plugin of plugins) {
    if (!pluginRegistry.isActive(plugin.id)) {
      await pluginRegistry.install(plugin.id, true);
    }
  }
}

/**
 * Gets the system prompt additions from all active plugins.
 * This injects plugin-specific context into the AI's system prompt.
 */
export function getPluginSystemPrompt(): string {
  const active = pluginRegistry.getActive();
  if (active.length === 0) return "";

  const sections = active.map((plugin) => {
    const tools = plugin.tools?.map((t) => `- ${t.name}: ${t.description}`).join("\n") ?? "";
    const skills = plugin.skills?.map((s) => `- ${s.name}: ${s.description}`).join("\n") ?? "";

    return [
      `## ${plugin.name} Plugin (${plugin.vertical})`,
      plugin.description,
      tools ? `\nAvailable tools:\n${tools}` : "",
      skills ? `\nAvailable skills:\n${skills}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return `\n---\nActive Plugins:\n${sections.join("\n\n")}`;
}
