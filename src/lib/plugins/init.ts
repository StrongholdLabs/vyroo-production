import { pluginRegistry } from "./registry";
import { ecommercePlugin } from "./ecommerce/index";

/**
 * Initialize built-in plugins.
 * Called once at app startup.
 */
export function initPlugins(): void {
  // Register built-in plugins
  pluginRegistry.register(ecommercePlugin);

  // In the future, load user-installed plugins from storage here
  console.log(
    `[Plugins] Initialized ${pluginRegistry.getAll().length} plugin(s)`
  );
}
