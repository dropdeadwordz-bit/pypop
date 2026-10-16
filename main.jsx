import { createRoot } from "react-dom/client";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/lexend";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";
import "./lib/install.js";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
