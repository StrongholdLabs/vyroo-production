import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPlugins } from "./lib/plugins/init";
import "./index.css";

// Initialize plugin system before rendering
initPlugins();

createRoot(document.getElementById("root")!).render(<App />);
