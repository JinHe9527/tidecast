import { useEffect, useState } from "react";
import { Waves } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PriceHeader } from "@/components/PriceHeader";
import { ExpiryPicker } from "@/components/ExpiryPicker";
import { StrikeLadder } from "@/components/StrikeLadder";
import { TicketPanel } from "@/components/TicketPanel";
import { VolSmile } from "@/components/VolSmile";
import { MarketHeat } from "@/components/MarketHeat";
import { PositionsPanel } from "@/components/PositionsPanel";
import { useOracles } from "@/hooks/useOracles";
import { usePrice } from "@/hooks/usePrice";
import { useDebounced, useQuote, type Direction } from "@/hooks/useQuote";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress } from "@/lib/utils";
import { DUSDC } from "@/lib/constants";

export function App() {
  const initWallet = useWallet((s) => s.init);
  const address = useWallet((s) => s.address);
  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const [oracleId, setOracleId] = useState<string | null>(null);
  const [pickedStrike, setPickedStrike] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("up");
  const [amount, setAmount] = useState(10);

  const { data: oracles, isPending: oraclesPending } = useOracles();
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
          {address && (
            <span className="font-mono text-xs text-ink-subtle">{shortenAddress(address, 6)}</span>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-8 md:grid-cols-[minmax(0,1fr)_300px]">
          <section className="flex min-w-0 flex-col gap-7">
            <PriceHeader price={price} />
            <ExpiryPicker
              isPending={oraclesPending}
              oracles={live}
              selectedId={oracle?.oracle_id}
              onSelect={setOracleId}
            />
            <StrikeLadder
              atm={atm}
              minStrike={oracle?.min_strike ?? 0}
              selected={strike}
              tickSize={oracle?.tick_size}
              onSelect={setPickedStrike}
            />
            <VolSmile
              expiry={oracle?.expiry}
              forward={price?.forward}
              oracleId={oracle?.oracle_id}
              strike={strike}
            />
            <MarketHeat oracleId={oracle?.oracle_id} />
          </section>
          <aside className="md:sticky md:top-8 md:self-start">
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
          </aside>
        </div>
        <div className="mx-auto w-full max-w-4xl px-6 pb-10">
          <PositionsPanel />
        </div>
      </main>
    </div>
  );
}
