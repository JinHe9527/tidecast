import { useLayoutEffect, useState } from "react";
import { motion } from "motion/react";
import { Waves } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Onboarding } from "@/components/Onboarding";
import { PriceHeader } from "@/components/PriceHeader";
import { ReadyBanner } from "@/components/ReadyBanner";
import { ExpiryPicker } from "@/components/ExpiryPicker";
import { StrikeLadder } from "@/components/StrikeLadder";
import { TicketPanel } from "@/components/TicketPanel";
import { VolSmile } from "@/components/VolSmile";
import { MarketHeat } from "@/components/MarketHeat";
import { PositionsPanel } from "@/components/PositionsPanel";
import { WalletPopover } from "@/components/WalletPopover";
import { useOracles } from "@/hooks/useOracles";
import { usePrice } from "@/hooks/usePrice";
import { useDebounced, useQuote, type Direction } from "@/hooks/useQuote";
import { useWallet } from "@/stores/walletStore";
import { DUSDC } from "@/lib/constants";

const EASE = [0.16, 1, 0.3, 1] as const;

/** One-shot mount reveal — panels fade up in reading order on first paint. */
function Reveal({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, delay: 0.05 * index, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function App() {
  const initWallet = useWallet((s) => s.init);
  const address = useWallet((s) => s.address);
  // Before paint, so a stored wallet never flashes the onboarding screen.
  useLayoutEffect(() => {
    initWallet();
  }, [initWallet]);

  const [oracleId, setOracleId] = useState<string | null>(null);
  const [pickedStrike, setPickedStrike] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("up");
  const [amount, setAmount] = useState(10);

  const { data: oracles, isPending: oraclesPending, isError: oraclesError } = useOracles();
  // Drop rows past expiry the server hasn't flipped yet; when the picked oracle
  // expires out of the list, fall to the next-nearest expiry.
  const live = (oracles ?? []).filter((o) => o.expiry > Date.now());
  const oracle = live.find((o) => o.oracle_id === oracleId) ?? live[0];
  const { data: price } = usePrice(oracle?.oracle_id);

  // Spot floored to the strike grid — ladder center and default selection.
  const atm =
    price && oracle ? Math.floor(price.spot / oracle.tick_size) * oracle.tick_size : undefined;
  const strike = pickedStrike ?? atm;

  const debouncedAmount = useDebounced(amount, 400);
  const quote = useQuote({
    oracleId: oracle?.oracle_id,
    expiry: oracle?.expiry,
    strike,
    direction,
    amountRaw: Math.round(debouncedAmount * 10 ** DUSDC.DECIMALS),
  });

  if (!address) return <Onboarding />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header
        data-tauri-drag-region
        className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-4"
      >
        <div className="w-16" />
        <Waves aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
        <span className="text-sm font-semibold tracking-tight">Tidecast</span>
        <div className="ml-auto flex items-center gap-2">
          <WalletPopover />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-10 pt-8">
          <ReadyBanner />
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
            <section className="flex min-w-0 flex-col gap-7">
              <Reveal index={0}>
                <PriceHeader price={price} />
              </Reveal>
              <Reveal index={1}>
                <ExpiryPicker
                  isError={oraclesError}
                  isPending={oraclesPending}
                  oracles={live}
                  selectedId={oracle?.oracle_id}
                  onSelect={setOracleId}
                />
              </Reveal>
              <Reveal index={2}>
                <StrikeLadder
                  atm={atm}
                  minStrike={oracle?.min_strike ?? 0}
                  selected={strike}
                  tickSize={oracle?.tick_size}
                  onSelect={setPickedStrike}
                />
              </Reveal>
              <Reveal index={3}>
                <VolSmile
                  expiry={oracle?.expiry}
                  forward={price?.forward}
                  oracleId={oracle?.oracle_id}
                  strike={strike}
                />
              </Reveal>
              <Reveal index={4}>
                <MarketHeat oracleId={oracle?.oracle_id} />
              </Reveal>
            </section>
            <aside className="md:sticky md:top-8 md:self-start">
              <Reveal index={1}>
                <TicketPanel
                  amount={amount}
                  direction={direction}
                  error={quote.error}
                  expiry={oracle?.expiry}
                  isFetching={quote.isFetching || amount !== debouncedAmount}
                  oracleId={oracle?.oracle_id}
                  quote={quote.data}
                  strike={strike}
                  onAmount={setAmount}
                  onDirection={setDirection}
                />
              </Reveal>
            </aside>
          </div>
          <Reveal index={5}>
            <PositionsPanel />
          </Reveal>
        </div>
      </main>
    </div>
  );
}
