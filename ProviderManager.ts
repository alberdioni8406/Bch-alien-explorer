/**
 * Modular provider manager.
 * Prefers live public data; falls back to clearly labeled demo fixtures.
 * Never presents fabricated live data.
 */

import type { BlockchainProvider } from "./types";
import { BchExplorerProvider } from "./BchExplorerProvider";
import { getDemoTransactions } from "../data/demoTransactions";
import type {
  NormalizedTransaction,
  MempoolInfo,
  NetworkStats,
  ProviderStatus,
} from "../types/blockchain";

export type DataMode = "live" | "demo" | "mixed";

class ProviderManager {
  private providers: BlockchainProvider[] = [];
  private active: BlockchainProvider | null = null;
  private mode: DataMode = "demo";
  private lastLiveFetch = 0;
  private cachedMempool: NormalizedTransaction[] = [];

  constructor() {
    this.providers.push(new BchExplorerProvider());
    this.active = this.providers[0];
  }

  getMode(): DataMode {
    return this.mode;
  }

  getActiveStatus(): ProviderStatus | null {
    return this.active?.getStatus() ?? null;
  }

  /** Attempt to load live mempool aliens. Falls back to demo on failure. */
  async loadMempoolAliens(limit = 24): Promise<{
    transactions: NormalizedTransaction[];
    mode: DataMode;
    message: string;
  }> {
    try {
      if (!this.active) throw new Error("No provider");
      const ids = await this.active.getMempoolTxIds(limit);
      if (!ids.length) throw new Error("Empty mempool response");

      const txs = await this.active.getTransactions(ids);
      if (!txs.length) throw new Error("Could not fetch any transaction details");

      this.cachedMempool = txs;
      this.lastLiveFetch = Date.now();
      this.mode = "live";
      return {
        transactions: txs,
        mode: "live",
        message: `Live data from ${this.active.name} — ${txs.length} mempool aliens`,
      };
    } catch (e) {
      console.warn("[ProviderManager] live load failed, using demo", e);
      this.mode = "demo";
      const demo = getDemoTransactions().map((d) => ({
        ...d,
        dataSource: "demo" as const,
        fetchedAt: Date.now(),
      }));
      return {
        transactions: demo,
        mode: "demo",
        message:
          "DEMO DATA — Live provider unavailable or rate-limited. Showing fixtures only.",
      };
    }
  }

  async getTransaction(txid: string): Promise<NormalizedTransaction | null> {
    // Try live first
    if (this.active) {
      try {
        const live = await this.active.getTransaction(txid);
        if (live) {
          this.mode = this.mode === "demo" ? "mixed" : "live";
          return live;
        }
      } catch {
        /* fall through */
      }
    }
    // Demo fallback
    const demo = getDemoTransactions().find((t) => t.txid === txid);
    if (demo) {
      return {
        ...demo,
        dataSource: "demo",
        fetchedAt: Date.now(),
      };
    }
    return null;
  }

  async getMempoolInfo(): Promise<MempoolInfo | null> {
    if (!this.active) return null;
    try {
      return await this.active.getMempoolInfo();
    } catch {
      return null;
    }
  }

  async getNetworkStats(): Promise<NetworkStats | null> {
    if (!this.active) return null;
    try {
      return await this.active.getNetworkStats();
    } catch {
      return null;
    }
  }

  getCachedMempool(): NormalizedTransaction[] {
    return this.cachedMempool;
  }
}

export const providerManager = new ProviderManager();
