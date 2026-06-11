import { useEffect } from "react";
import { Waves } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress } from "@/lib/utils";

export function App() {
  const initWallet = useWallet((s) => s.init);
  const address = useWallet((s) => s.address);
  useEffect(() => {
    initWallet();
  }, [initWallet]);

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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-ink-subtle">Reading the tide… (data layer lands next)</p>
      </main>
    </div>
  );
}
