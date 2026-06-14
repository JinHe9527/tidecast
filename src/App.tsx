import { useLayoutEffect, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Onboarding } from "@/components/Onboarding";
import { HeaderTicker } from "@/components/PriceHeader";
import { ReadyBanner } from "@/components/ReadyBanner";
import { ExpiryPicker } from "@/components/ExpiryPicker";
import { AccountMini } from "@/components/AccountMini";
import { StrikeLadder } from "@/components/StrikeLadder";
import { TicketPanel } from "@/components/TicketPanel";
import { VolSmile } from "@/components/VolSmile";
import { MarketHeat } from "@/components/MarketHeat";
import { PositionsPanel } from "@/components/PositionsPanel";
import { WalletPopover } from "@/components/WalletPopover";
import { useOracles } from "@/hooks/useOracles";
import { usePrice } from "@/hooks/usePrice";
import { useSvi } from "@/hooks/useSvi";
import { useMarketPositions } from "@/hooks/useMarketPositions";
import { useDebounced, useQuote, type Direction } from "@/hooks/useQuote";
import { useWallet } from "@/stores/walletStore";
import { DUSDC } from "@/lib/constants";

const SPAN = 4; // ticks above/below ATM → up to 9 strikes, the shared instrument domain
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function App() {
  const initWallet = useWallet((s) => s.init);
  const address = useWallet((s) => s.address);
  // Before paint, so a stored wallet never flashes the onboarding screen.
  useLayoutEffect(() => {
    initWallet();
  }, [initWallet]);

  const [oracleId, setOracleId] = useState<string | null>(null);
  const [pickedStrike, setPickedStrike] = useState<number | null>(null);
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("up");
  const [amount, setAmount] = useState(10);

  const { data: oracles, isPending: oraclesPending, isError: oraclesError } = useOracles();
  // Drop rows past expiry the server hasn't flipped yet; when the picked oracle
  // expires out of the list, fall to the next-nearest expiry.
  const live = (oracles ?? []).filter((o) => o.expiry > Date.now());
  const oracle = live.find((o) => o.oracle_id === oracleId) ?? live[0];
  const { data: price } = usePrice(oracle?.oracle_id);
  const { data: svi } = useSvi(oracle?.oracle_id);
  const market = useMarketPositions(oracle?.oracle_id);

  // Spot floored to the strike grid — ladder center and default selection.
  const atm = price && oracle ? Math.floor(price.spot / oracle.tick_size) * oracle.tick_size : undefined;
  const strike = pickedStrike ?? atm;

  // The shared strike domain: ladder rows (high→low) AND the smile/heat X-axis.
  const strikes: number[] = [];
  if (atm !== undefined && oracle) {
    for (let i = SPAN; i >= -SPAN; i--) {
      const s = atm + i * oracle.tick_size;
      if (s >= oracle.min_strike) strikes.push(s);
    }
  }
  const strikeHi = strikes[0];
  const strikeLo = strikes.at(-1);
  const T = oracle ? (oracle.expiry - Date.now()) / YEAR_MS : 0;

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
      <header data-tauri-drag-region className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline px-4">
        <div className="w-16" />
        <LogoMark className="size-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight">Tidecast</span>
        <span aria-hidden className="h-4 w-px bg-hairline" />
        <HeaderTicker oracleId={oracle?.oracle_id} price={price} />
        <div className="ml-auto flex items-center gap-2">
          <WalletPopover />
          <ThemeToggle />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)_360px] gap-3 p-3">
        <aside className="flex min-h-0 flex-col gap-3">
          <ExpiryPicker
            isError={oraclesError}
            isPending={oraclesPending}
            oracles={live}
            selectedId={oracle?.oracle_id}
            onSelect={setOracleId}
          />
          <AccountMini />
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          <ReadyBanner />
          <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-3 lift">
            <VolSmile
              expiry={oracle?.expiry}
              forward={price?.forward}
              hoveredStrike={hoveredStrike}
              oracleId={oracle?.oracle_id}
              selectedStrike={strike}
              strikeHi={strikeHi}
              strikeLo={strikeLo}
            />
            <MarketHeat
              data={market.data}
              hoveredStrike={hoveredStrike}
              isPending={market.isPending}
              strikeHi={strikeHi}
              strikeLo={strikeLo}
              onHover={setHoveredStrike}
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <StrikeLadder
              atm={atm}
              direction={direction}
              forward={price?.forward}
              hoveredStrike={hoveredStrike}
              market={market.data}
              selected={strike}
              strikes={strikes}
              svi={svi}
              yearsToExpiry={T}
              onHover={setHoveredStrike}
              onSelect={(s, d) => {
                setPickedStrike(s);
                setDirection(d);
              }}
            />
          </div>
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
      </main>

      <footer className="h-[200px] shrink-0 border-t border-hairline px-3 py-2">
        <PositionsPanel />
      </footer>
    </div>
  );
}
