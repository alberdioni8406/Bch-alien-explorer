/**
 * Public REST provider for Bitcoin Cash mainnet.
 * Primary: rest.bch.actorforth.org + fullstack.cash fallbacks.
 * Read-only, no credentials. Never invents data.
 */

import type { BlockchainProvider } from "./types";
import type {
  NormalizedTransaction,
  MempoolInfo,
  NetworkStats,
  ProviderStatus,
  TxInput,
  TxOutput,
  AlienCategory,
  CashTokenData,
} from "../types/blockchain";

const ENDPOINTS = {
  actor: "https://rest.bch.actorforth.org/v2",
  fullstack: "https://bch.fullstack.cash/v6/full-node",
};

const FETCH_TIMEOUT_MS = 14000;

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "BCH-Alien-Explorer/0.1",
      },
    });
    if (!res.ok) {
      console.warn(`[Provider] ${url} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[Provider] fetch failed`, url, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function classifyCategory(opts: {
  feeSats: number;
  size: number;
  inputCount: number;
  outputCount: number;
  totalOut: number;
  hasToken: boolean;
  confirmed: boolean;
}): AlienCategory {
  if (opts.totalOut > 5_000_00000) return "whale";
  if (opts.hasToken) return "token";
  if (opts.outputCount >= 5) return "multi-output";
  if (opts.inputCount >= 3) return "complex";
  return opts.confirmed ? "regular" : "unconfirmed";
}

function normalizeTx(raw: any): NormalizedTransaction {
  const inputs: TxInput[] = (raw.vin || []).map((vin: any, i: number) => ({
    prevTxId: vin.txid || "unknown",
    prevOutIndex: vin.vout ?? i,
    valueSats: vin.value != null ? Math.round(Number(vin.value) * (vin.value < 1000 ? 1e8 : 1)) : undefined,
    unlockingScript: vin.scriptSig?.hex || vin.scriptSig?.asm || vin.scriptsig,
    address: vin.address,
  }));

  const outputs: TxOutput[] = (raw.vout || []).map((vout: any, i: number) => {
    const spk = vout.scriptPubKey || {};
    const type = (spk.type || "").toLowerCase();
    const isOpReturn = type.includes("nulldata") || type.includes("op_return") || (spk.asm || "").includes("OP_RETURN");
    let cashTokens: CashTokenData | undefined;
    if (vout.tokenData || vout.token) {
      const t = vout.tokenData || vout.token;
      cashTokens = {
        category: t.category || t.tokenId || "",
        amount: String(t.amount ?? "0"),
      };
    }
    let valueSats = 0;
    if (typeof vout.value === "number") {
      valueSats = vout.value < 1000 ? Math.round(vout.value * 1e8) : Math.round(vout.value);
    } else if (vout.valueSats) {
      valueSats = Math.round(vout.valueSats);
    }
    return {
      index: vout.n ?? i,
      valueSats,
      address: spk.addresses?.[0] || spk.address || vout.address,
      lockingScript: spk.hex || spk.asm,
      cashTokens,
      opReturn: isOpReturn ? (spk.asm || "").slice(0, 100) : undefined,
      isOpReturn,
    };
  });

  const totalOutputSats = outputs.reduce((s, o) => s + o.valueSats, 0);
  const totalInputSats = inputs.reduce((s, i) => s + (i.valueSats || 0), 0);
  let feeSats = 0;
  if (raw.fee != null) {
    feeSats = typeof raw.fee === "number" && raw.fee < 1 ? Math.round(raw.fee * 1e8) : Math.round(raw.fee);
  } else if (totalInputSats > 0 && totalOutputSats > 0) {
    feeSats = Math.max(0, totalInputSats - totalOutputSats);
  }
  const size = raw.size || raw.vsize || 200;
  const feeRate = size > 0 ? feeSats / size : 0;
  const confirmed = !!(raw.blockhash || (raw.confirmations && raw.confirmations > 0) || raw.blockheight);

  const hasCashTokens = outputs.some((o) => !!o.cashTokens) || inputs.some((i) => !!i.cashTokens);

  let h = 0;
  const id = raw.txid || "";
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  const r = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  };
  const position: [number, number, number] = [
    (r() - 0.5) * 28,
    (r() - 0.5) * 10,
    (r() - 0.5) * 28,
  ];

  return {
    txid: raw.txid,
    version: raw.version ?? 1,
    locktime: raw.locktime ?? 0,
    size,
    confirmed,
    blockHeight: raw.blockheight || raw.blockHeight,
    blockHash: raw.blockhash,
    blockTimestamp: raw.blocktime,
    confirmations: raw.confirmations,
    feeSats,
    feeRate,
    totalInputSats,
    totalOutputSats,
    inputCount: inputs.length,
    outputCount: outputs.length,
    hasCashTokens,
    category: classifyCategory({
      feeSats,
      size,
      inputCount: inputs.length,
      outputCount: outputs.length,
      totalOut: totalOutputSats,
      hasToken: hasCashTokens,
      confirmed,
    }),
    inputs,
    outputs,
    dataSource: "live",
    fetchedAt: Date.now(),
    position,
  };
}

export class BchExplorerProvider implements BlockchainProvider {
  readonly name = "actorforth+fullstack";
  private lastError?: string;
  private lastSuccessAt?: number;
  private available = true;

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: this.available,
      lastError: this.lastError,
      lastSuccessAt: this.lastSuccessAt,
    };
  }

  async getMempoolTxIds(limit = 40): Promise<string[]> {
    let data = await fetchJson<string[]>(`${ENDPOINTS.actor}/blockchain/getRawMempool`);
    if (!data || !Array.isArray(data)) {
      data = await fetchJson<string[]>(`${ENDPOINTS.fullstack}/blockchain/getRawMempool`);
    }
    if (!data || !Array.isArray(data) || !data.length) {
      this.available = false;
      this.lastError = "getRawMempool failed on all endpoints";
      return [];
    }
    this.available = true;
    this.lastSuccessAt = Date.now();
    return data.slice(0, limit);
  }

  async getTransaction(txid: string): Promise<NormalizedTransaction | null> {
    if (!/^[a-fA-F0-9]{64}$/.test(txid)) return null;

    let raw = await fetchJson<any>(
      `${ENDPOINTS.actor}/rawtransactions/getRawTransaction/${txid}?verbose=true`
    );
    if (!raw || !raw.txid) {
      raw = await fetchJson<any>(
        `${ENDPOINTS.fullstack}/rawtransactions/getRawTransaction/${txid}?verbose=true`
      );
    }
    if (!raw || !raw.txid) {
      this.lastError = `tx ${txid.slice(0, 8)}… not found`;
      return null;
    }
    this.lastSuccessAt = Date.now();
    this.available = true;
    return normalizeTx(raw);
  }

  async getTransactions(txids: string[]): Promise<NormalizedTransaction[]> {
    const results: NormalizedTransaction[] = [];
    for (const id of txids.slice(0, 18)) {
      const tx = await this.getTransaction(id);
      if (tx) results.push(tx);
      await new Promise((r) => setTimeout(r, 60));
    }
    return results;
  }

  async getMempoolInfo(): Promise<MempoolInfo | null> {
    const ids = await this.getMempoolTxIds(500);
    if (!ids.length) return null;
    return {
      size: ids.length,
      bytes: 0,
      fetchedAt: Date.now(),
      source: this.name,
    };
  }

  async getNetworkStats(): Promise<NetworkStats | null> {
    let height = 0;
    let h = await fetchJson<number>(`${ENDPOINTS.actor}/blockchain/getBlockCount`);
    if (typeof h === "number") height = h;
    if (!height) {
      h = await fetchJson<number>(`${ENDPOINTS.fullstack}/blockchain/getBlockCount`);
      if (typeof h === "number") height = h;
    }
    const mem = await this.getMempoolInfo();
    return {
      blockHeight: height,
      mempoolTxCount: mem?.size ?? 0,
      fetchedAt: Date.now(),
      source: this.name,
      stale: !height,
    };
  }
}
