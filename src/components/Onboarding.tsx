import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Upload, Waves } from "lucide-react";
import { Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/stores/walletStore";

const EASE = [0.16, 1, 0.3, 1] as const;

/** First-run / no-wallet state: create or import a local wallet to start trading. */
export function Onboarding() {
  const generate = useWallet((s) => s.generate);
  const importKey = useWallet((s) => s.importKey);
  const error = useWallet((s) => s.error);
  const [mode, setMode] = useState<"choose" | "import">("choose");
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header data-tauri-drag-region className="h-12 shrink-0" />
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-sm flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <span className="lift flex size-16 items-center justify-center rounded-2xl border border-hairline bg-surface-1">
            <Waves aria-hidden className="size-8 text-accent" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-ink">Welcome to Tidecast</h1>
            <p className="text-sm text-ink-subtle">
              A local wallet signs your Sui transactions — testnet only, stored on this device.
            </p>
          </div>

          {mode === "choose" ? (
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" size="lg" variant="primary" onPress={() => generate()}>
                <Plus className="size-4" /> Generate a new wallet
              </Button>
              <Button className="w-full" size="lg" variant="secondary" onPress={() => setMode("import")}>
                <Upload className="size-4" /> Import an existing key
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Input
                autoFocus
                aria-label="Private key"
                className="selectable font-mono"
                placeholder="suiprivkey1…"
                value={draft}
                variant="secondary"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && importKey(draft)}
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  isDisabled={!draft.trim()}
                  variant="primary"
                  onPress={() => importKey(draft)}
                >
                  Import
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => {
                    setMode("choose");
                    setDraft("");
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
