import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { Landing } from "./landing/Landing";
import "./globals.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
});

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

// The desktop shell (Tauri) is the app itself. In the browser, `/` is the
// marketing landing and `/app` is the live console.
const isTauri = "__TAURI_INTERNALS__" in window;

createRoot(root).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        {isTauri ? (
          <App />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<App />} />
            </Routes>
          </BrowserRouter>
        )}
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
);
