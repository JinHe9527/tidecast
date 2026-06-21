import { motion } from "motion/react";
import { ArrowUpRight, Play } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { GITHUB, DEMO, PROOF } from "./links";

const CHECK: [string, string][] = [
  ["devInspect.quote()", "live · gas-free"],
  ["predict.mint() / redeem()", "signed in-process"],
  ["tx.digest", "verified on suiscan"],
  ["vol.surface (SVI)", "rendered"],
  ["wallet.extension", "not required"],
  ["backend.server", "none"],
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <header className="editorial-grid border-b border-black/10">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
        <LogoMark className="size-6 text-[#0ea5c4]" />
        <span className="text-lg font-black tracking-tight">Tidecast</span>
        <span className="ml-1 hidden text-[11px] font-medium uppercase tracking-widest text-black/45 sm:inline">
          DeepBook · Sui Overflow 2026
        </span>
        <div className="ml-auto flex items-center gap-1 text-sm font-semibold">
          <a className="rounded-md px-3 py-1.5 text-black/70 hover:text-black" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          <a className="rounded-md px-3 py-1.5 text-black/70 hover:text-black" href={DEMO} target="_blank" rel="noreferrer">Demo</a>
          <a className="inline-flex items-center gap-1 rounded-md bg-[#0b0b0c] px-3.5 py-1.5 text-white hover:bg-black" href="/app">
            Launch console <ArrowUpRight className="size-4" />
          </a>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <div className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-black/55">
            <span className="size-2 rounded-full bg-[#0ea5c4]" /> The desk for DeepBook Predict
          </div>
          <h1 className="text-balance text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            DeepBook Predict has a price.<br />It needed a desk.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/65">
            Tidecast is the desktop trading terminal for DeepBook Predict — Sui's on-chain BTC
            prediction market. It draws the live volatility surface, prices every strike gas-free,
            and mints or redeems in one click, signed in-process.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="/app" className="inline-flex items-center gap-2 rounded-lg bg-[#0b0b0c] px-5 py-3 text-sm font-bold text-white hover:bg-black">
              Launch the console <ArrowUpRight className="size-4" />
            </a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-5 py-3 text-sm font-bold hover:border-black/40">
              GitHub
            </a>
            <a href={DEMO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-bold text-black/70 hover:text-black">
              <Play className="size-4" /> Watch demo
            </a>
          </div>
          <a href={PROOF} target="_blank" rel="noreferrer" className="mt-6 inline-block font-mono text-xs text-black/45 hover:text-[#0ea5c4]">
            ● live on sui testnet · real mint 8wDTPzWh…ZmUif ↗
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="rounded-xl border border-white/10 bg-[#0a0e16] p-5 font-mono text-sm shadow-2xl shadow-black/30"
        >
          <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
            <span className="text-white/45">Integration check</span>
            <span className="rounded bg-[#0ea5c4]/15 px-2 py-0.5 text-[#22d3ee]">Sui · Testnet</span>
          </div>
          <ul className="space-y-2.5">
            {CHECK.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-4">
                <span className="text-white/70">{k}</span>
                <span className="text-[#22d3ee]">{v}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </header>
  );
}
