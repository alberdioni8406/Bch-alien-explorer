/**
 * Normalized blockchain types used across the app.
 * All monetary values are integer satoshis.
 */

export type AlienCategory =
  | "regular"
  | "whale"
  | "token"
  | "multi-output"
  | "complex"
  | "unconfirmed";

export interface CashTokenData {
  category: string;
  amount: string; // string to support large token amounts
  nft?: {
    capability?: string;
    commitment?: string;
  };
}

export interface TxInput {
  prevTxId: string;
  prevOutIndex: number;
  valueSats?: number; // may be unavailable for unconfirmed or missing prevouts
  unlockingScript?: string;
  cashTokens?: CashTokenData;
  address?: string;
}

export interface TxOutput {
  index: number;
  valueSats: number;
  address?: string;
  lockingScript?: string;
  cashTokens?: CashTokenData;
  opReturn?: string;
  isOpReturn?: boolean;
}

export interface NormalizedTransaction {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  confirmed: boolean;
  blockHeight?: number;
  blockHash?: string;
  blockTimestamp?: number;
  confirmations?: number;
  positionInBlock?: number;
  feeSats: number;
  feeRate: number; // sats per byte
  totalInputSats: number;
  totalOutputSats: number;
  inputCount: number;
  outputCount: number;
  hasCashTokens: boolean;
  category: AlienCategory;
  inputs: TxInput[];
  outputs: TxOutput[];
  rawHex?: string;
  /** 3D placement seed (derived or assigned) */
  position?: [number, number, number];
  /** Source of data for transparency */
  dataSource: "live" | "demo" | "partial";
  /** Timestamp when this data was fetched */
  fetchedAt: number;
}

export interface MempoolInfo {
  size: number;
  bytes: number;
  usage?: number;
  mempoolminfee?: number;
  fetchedAt: number;
  source: string;
}

export interface NetworkStats {
  blockHeight: number;
  bestBlockHash?: string;
  difficulty?: number;
  mempoolTxCount: number;
  latestBlockTimestamp?: number;
  latestBlockSize?: number;
  fetchedAt: number;
  source: string;
  stale: boolean;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  lastError?: string;
  lastSuccessAt?: number;
}
