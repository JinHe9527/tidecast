import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tauri drives the dev server; keep the port fixed and fail loudly if taken so
// tauri.conf.json devUrl stays in sync. See https://v2.tauri.app/start/frontend/vite
const host = process.env.TAURI_DEV_HOST;

// Split heavy vendors into separate chunks so the app chunk stays small.
// IDs go through bun's store layout (.bun/<scope>+<name>@<ver>/node_modules/<scope>/<name>/...),
// so match on the real package name after the LAST node_modules/, not the encoded store dir.
const VENDOR_CHUNKS: Record<string, (pkg: string) => boolean> = {
  "react-vendor": (p) =>
    p === "react" || p === "react-dom" || p === "scheduler" || p === "use-sync-external-store",
  // HeroUI sits on the React-Aria stack; they reference each other, so keep them in one
  // chunk to avoid a circular cross-chunk dependency.
  heroui: (p) =>
    p.startsWith("@heroui/") ||
    p.startsWith("@radix-ui/") ||
    p === "react-aria" ||
    p === "react-aria-components" ||
    p === "react-stately" ||
    p.startsWith("@react-aria/") ||
    p.startsWith("@react-stately/") ||
    p.startsWith("@internationalized/") ||
    p.startsWith("@formatjs/") ||
    p === "intl-messageformat" ||
    p === "tailwind-variants" ||
    p === "tailwind-merge" ||
    p === "input-otp" ||
    p === "clsx",
  sui: (p) =>
    p.startsWith("@mysten/") ||
    p.startsWith("@noble/") ||
    p.startsWith("@scure/") ||
    p === "graphql" ||
    p === "poseidon-lite" ||
    p === "valibot",
  motion: (p) => p === "motion" || p === "motion-dom" || p === "motion-utils" || p === "framer-motion",
  query: (p) => p.startsWith("@tanstack/"),
  lucide: (p) => p === "lucide-react",
};

function chunkForVendor(id: string): string | undefined {
  const marker = "node_modules/";
  const last = id.lastIndexOf(marker);
  if (last === -1) return undefined;
  const rest = id.slice(last + marker.length);
  const segs = rest.split("/");
  const pkg = rest.startsWith("@") ? `${segs[0]}/${segs[1]}` : segs[0];
  for (const [chunk, match] of Object.entries(VENDOR_CHUNKS)) {
    if (match(pkg)) return chunk;
  }
  return "vendor";
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Resolve the bun workspace package straight to its TS source — no build step.
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) return chunkForVendor(id);
        },
      },
    },
  },
  // Vite swallows Rust errors otherwise.
  clearScreen: false,
  server: {
    host: host || false,
    port: 5174,
    strictPort: true,
    hmr: host ? { protocol: "ws", host, port: 5175 } : undefined,
    watch: {
      // The Rust backend rebuilds itself; don't let Vite watch it.
      ignored: ["**/src-tauri/**"],
    },
  },
});
