import { useState } from "react";
import { AlertDialog, Input, Popover } from "@heroui/react";
import {
  Check,
  ChevronDown,
  Copy,
  Droplet,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDusdc } from "@/hooks/useDusdc";
import { useFaucet } from "@/hooks/useFaucet";
import { useSuiBalance } from "@/hooks/useSuiBalance";
import { useWallet } from "@/stores/walletStore";
import { fmtDusdc } from "@/lib/constants";
import { openExternal } from "@/lib/openExternal";
import { shortenAddress } from "@/lib/utils";

/** Destructive-flavored confirm: generating switches the active signing key. */
function GenerateConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <Button size="sm" variant="ghost">
        <Plus className="size-3.5" /> Generate new
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-sm">
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>Generate a new wallet?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-ink-subtle">
                This creates a fresh key and makes it the active signer. Reveal and back up your
                current key first — funds stay on the old address.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
              <Button slot="close" variant="danger" onPress={onConfirm}>
                Generate
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function WalletDetails() {
  const address = useWallet((s) => s.address) ?? "";
  const generate = useWallet((s) => s.generate);
  const importKey = useWallet((s) => s.importKey);
  const reveal = useWallet((s) => s.reveal);
  const error = useWallet((s) => s.error);
  const { data: sui } = useSuiBalance();
  const { data: dusdc } = useDusdc();
  const faucet = useFaucet();
  const [mode, setMode] = useState<"view" | "reveal" | "import">("view");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1_500);
  }

  if (mode === "reveal") {
    const secret = reveal() ?? "";
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
        <p className="text-xs text-danger">Anyone with this key controls the wallet. Never share it.</p>
        <div className="flex items-center gap-1.5">
          <code className="selectable min-w-0 flex-1 truncate rounded bg-canvas px-2 py-1.5 font-mono text-xs text-ink-muted">
            {secret}
          </code>
          <Button isIconOnly aria-label="Copy secret" size="sm" variant="ghost" onPress={() => copy("sk", secret)}>
            {copied === "sk" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
        <Button className="self-start" size="sm" variant="secondary" onPress={() => setMode("view")}>
          <EyeOff className="size-3.5" /> Hide
        </Button>
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          aria-label="Private key"
          className="selectable font-mono"
          placeholder="suiprivkey1… — becomes the active signer"
          value={draft}
          variant="secondary"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && importKey(draft) && setMode("view")}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <Button
            isDisabled={!draft.trim()}
            size="sm"
            variant="primary"
            onPress={() => importKey(draft) && setMode("view")}
          >
            Import
          </Button>
          <Button size="sm" variant="ghost" onPress={() => setMode("view")}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <code className="selectable min-w-0 flex-1 break-all rounded bg-surface-2 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-ink-muted">
          {address}
        </code>
        <Button isIconOnly aria-label="Copy address" size="sm" variant="ghost" onPress={() => copy("addr", address)}>
          {copied === "addr" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-ink-subtle">SUI</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {sui === undefined ? "…" : sui.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
          {faucet.status === "error" && (
            <Button size="sm" variant="primary" onPress={() => openExternal(faucet.webFaucetUrl)}>
              <ExternalLink className="size-3.5" /> Web faucet
            </Button>
          )}
          <Button
            isDisabled={faucet.status === "loading"}
            size="sm"
            variant="secondary"
            onPress={faucet.request}
          >
            {faucet.status === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : faucet.status === "ok" ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Droplet className="size-3.5" />
            )}
            {faucet.status === "ok" ? "Requested" : faucet.status === "error" ? "Retry" : "Faucet"}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-ink-subtle">dUSDC</span>
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {dusdc === undefined ? "…" : fmtDusdc(dusdc)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="ghost" onPress={() => setMode("reveal")}>
          <Eye className="size-3.5" /> Reveal key
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setMode("import")}>
          <Upload className="size-3.5" /> Import key
        </Button>
        <GenerateConfirm onConfirm={generate} />
      </div>
    </div>
  );
}

/** Header wallet affordance — address chip opening balances + key management. */
export function WalletPopover() {
  const address = useWallet((s) => s.address);
  if (!address) return null;

  return (
    <Popover>
      <Button size="sm" variant="ghost">
        <span className="font-mono text-xs text-ink-subtle">{shortenAddress(address, 6)}</span>
        <ChevronDown aria-hidden className="size-3 text-ink-tertiary" />
      </Button>
      <Popover.Content className="w-80" placement="bottom end">
        <Popover.Dialog aria-label="Wallet">
          <WalletDetails />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
