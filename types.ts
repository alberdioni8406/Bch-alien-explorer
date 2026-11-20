import type {
  NormalizedTransaction,
  MempoolInfo,
  NetworkStats,
  ProviderStatus,
} from "../types/blockchain";

export interface BlockchainProvider {
  readonly name: string;
  getStatus(): ProviderStatus;

  /** Latest mempool transaction IDs (limited for performance) */
  getMempoolTxIds(limit?: number): Promise<string[]>;

  /** Fetch and normalize a single transaction */
  getTransaction(txid: string): Promise<NormalizedTransaction | null>;

  /** Batch fetch (best-effort, may be sequential) */
  getTransactions(txids: string[]): Promise<NormalizedTransaction[]>;

  getMempoolInfo(): Promise<MempoolInfo | null>;
  getNetworkStats(): Promise<NetworkStats | null>;
}
