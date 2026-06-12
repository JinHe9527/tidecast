import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Open a URL in the system browser. window.open is a silent no-op inside the
 * Tauri WKWebView (no new-window handler), so route through the opener plugin
 * there and fall back to window.open in plain-browser dev.
 */
export function openExternal(url: string): void {
  if ("__TAURI_INTERNALS__" in window) {
    void openUrl(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}
