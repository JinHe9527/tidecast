const SHOTS: { src: string; cap: string; narrow?: boolean; right?: boolean }[] = [
  {
    src: "/landing/01-terminal.jpg",
    cap: "The live volatility smile, strike ladder, order ticket and positions — one linked instrument.",
  },
  {
    src: "/landing/04-smile.jpg",
    cap: "The live SVI fit over the full surface — the ATM trough, your strike, and the skew the market is paying up for.",
    narrow: true,
  },
  {
    src: "/landing/03-mint.jpg",
    cap: "One click mints on testnet — signed in-process, with a Suiscan link in the toast.",
    narrow: true,
    right: true,
  },
];

export function Showcase() {
  return (
    <section className="border-y border-white/10 bg-[#0b0f17] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-10 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Inside the terminal</h2>
        <div className="space-y-6">
          {SHOTS.map((s) => (
            <figure
              key={s.src}
              className={`overflow-hidden rounded-xl border border-white/10 ${s.narrow ? "md:w-[85%]" : ""} ${s.right ? "md:ml-auto" : ""}`}
            >
              <img src={s.src} alt={s.cap} className="w-full" loading="lazy" />
              <figcaption className="bg-black/40 px-5 py-3 font-mono text-xs text-white/55">{s.cap}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
