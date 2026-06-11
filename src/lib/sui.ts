import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SUI_NETWORK } from "@/lib/constants";

/** Shared read client — devInspect quotes and chain reads. */
export const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
