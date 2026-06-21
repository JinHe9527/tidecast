import { ArrowUpRight } from "lucide-react";
import { GITHUB, DEMO } from "./links";

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-2xl border border-black/10 bg-white p-10 text-center sm:p-14">
        <h2 className="mx-auto max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          Trade the surface, not a bet button.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/app" className="inline-flex items-center gap-2 rounded-lg bg-[#0b0b0c] px-6 py-3 text-sm font-bold text-white hover:bg-black">
            Launch the console <ArrowUpRight className="size-4" />
          </a>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-6 py-3 text-sm font-bold hover:border-black/40">
            GitHub
          </a>
          <a href={DEMO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-black/70 hover:text-black">
            Demo video
          </a>
        </div>
      </div>
      <p className="mt-10 text-center font-mono text-xs text-black/40">
        Tidecast · built for Sui Overflow 2026 · DeepBook track · pure integration with DeepBook Predict
      </p>
    </footer>
  );
}
