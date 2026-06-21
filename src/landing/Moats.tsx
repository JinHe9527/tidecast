const MOATS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "The volatility surface, drawn",
    body: "A live SVI vol smile and a per-strike positioning heatmap, sharing one strike axis with the ladder. Hover a strike — the smile marker, the heat bar and the ticket all track it. The surface is the product, not a number behind a quote.",
  },
  {
    n: "02",
    title: "A native desk, not a web page",
    body: "Tauri desktop with in-process Ed25519 signing — no wallet popup, no browser chrome, no backend of our own. The density and latency of a real trading terminal.",
  },
  {
    n: "03",
    title: "Real and checkable",
    body: "Gas-free devInspect quotes priced against the same SVI surface Predict settles on, and a real testnet mint you can open on Suiscan. No mock counterparty, no placeholder charts.",
  },
];

export function Moats() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">What sets it apart</h2>
      <p className="mb-10 max-w-2xl text-white/60">
        DeepBook Predict has a few front-ends now — a Telegram betting game, an AI chat assistant,
        a payoff-curve builder. Tidecast is the one built for whoever actually prices the trade.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {MOATS.map((m) => (
          <div key={m.n} className="flex flex-col rounded-xl border border-white/10 bg-[#0f141c] p-6">
            <span className="mb-5 inline-flex size-9 items-center justify-center rounded-md bg-[#22d3ee] font-mono text-sm font-bold text-[#06121a]">
              {m.n}
            </span>
            <h3 className="text-lg font-bold uppercase tracking-tight">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
