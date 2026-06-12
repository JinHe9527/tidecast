import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import type { SuiObjectChange } from "@mysten/sui/client";
import { suiClient } from "@/lib/sui";
import { DUSDC, PREDICT, TEST_WALLET } from "@/lib/constants";
import { useWallet } from "@/stores/walletStore";

const cacheKey = (address: string) => `tidecast-manager:${address}`;

/** One row of GET /managers — a create_manager event. */
interface ManagerRow {
  manager_id: string;
  owner: string;
  checkpoint_timestamp_ms: number;
}

/** The address's newest PredictManager from the indexer; localStorage caches the hit. */
async function discoverManager(address: string): Promise<string | null> {
  const cached = localStorage.getItem(cacheKey(address));
  if (cached) return cached;
  const res = await fetch(`${PREDICT.SERVER}/managers`);
  if (!res.ok) throw new Error(`managers: HTTP ${res.status}`);
  const rows = (await res.json()) as ManagerRow[];
  const newest = rows
    .filter((r) => r.owner === address)
    .sort((a, b) => Number(b.checkpoint_timestamp_ms) - Number(a.checkpoint_timestamp_ms))[0];
  if (!newest) return null;
  localStorage.setItem(cacheKey(address), newest.manager_id);
  return newest.manager_id;
}

/**
 * The wallet's PredictManager (a SHARED object every trade call takes &mut on).
 * Discovery via the indexer; `create` runs predict::create_manager when none exists —
 * a shared object needs its own tx before it can be used, so create can't chain into mint.
 */
export function useManager() {
  const address = useWallet((s) => s.address);
  const keypair = useWallet((s) => s.keypair);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["manager", address],
    enabled: !!address,
    staleTime: Infinity,
    queryFn: () => {
      if (!address) throw new Error("manager: no wallet");
      return discoverManager(address);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!keypair || !address) throw new Error("No wallet loaded.");
      const tx = new Transaction();
      tx.moveCall({ target: `${PREDICT.PACKAGE}::predict::create_manager` });
      const res = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
      });
      await suiClient.waitForTransaction({ digest: res.digest });
      const status = res.effects?.status;
      if (status?.status !== "success") {
        throw new Error(status?.error ?? "create_manager failed");
      }
      const created = res.objectChanges?.find(
        (c): c is Extract<SuiObjectChange, { type: "created" }> =>
          c.type === "created" && c.objectType.endsWith("::predict_manager::PredictManager"),
      );
      if (!created) throw new Error("create_manager: no PredictManager in objectChanges");
      localStorage.setItem(cacheKey(address), created.objectId);
      return created.objectId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manager"] }),
  });

  return { managerId: query.data ?? null, isPending: query.isPending && !!address, create };
}

/** Manager dUSDC balance (6-dec raw) via devInspect — refetched after every trade. */
export function useManagerBalance(managerId: string | null) {
  const address = useWallet((s) => s.address);
  return useQuery({
    queryKey: ["managerBalance", managerId],
    enabled: !!managerId,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!managerId) throw new Error("balance: no manager");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PREDICT.PACKAGE}::predict_manager::balance`,
        typeArguments: [DUSDC.TYPE],
        arguments: [tx.object(managerId)],
      });
      const res = await suiClient.devInspectTransactionBlock({
        sender: address ?? TEST_WALLET,
        transactionBlock: tx,
      });
      if (res.error) throw new Error(`balance failed: ${res.error}`);
      const ret = res.results?.[0]?.returnValues?.[0];
      if (!ret) throw new Error("balance failed: no return value");
      return BigInt(bcs.u64().parse(Uint8Array.from(ret[0])));
    },
  });
}
