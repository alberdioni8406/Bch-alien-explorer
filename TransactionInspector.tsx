import { useState } from "react";
import type { NormalizedTransaction } from "../types/blockchain";
import { DEMO_LABEL } from "../data/demoTransactions";
import { generateAlienAppearance, hslToHex } from "../lib/alienGenerator";

interface Props {
  transaction: NormalizedTransaction | null;
  onClose: () => void;
}

function formatSats(sats: number): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(8)} BCH`;
  }
  return `${sats.toLocaleString()} sats`;
}

function shortTxid(txid: string): string {
  return `${txid.slice(0, 10)}…${txid.slice(-8)}`;
}

export function TransactionInspector({ transaction, onClose }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const appearance = generateAlienAppearance(transaction);
  const bodyColor = hslToHex(
    appearance.bodyHue,
    appearance.bodySaturation,
    appearance.bodyLightness
  );

  const copyTxid = async () => {
    try {
      await navigator.clipboard.writeText(transaction.txid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
    }
  };

  return (
    <div className="inspector-overlay" onClick={onClose}>
      <div
        className="inspector-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: bodyColor,
          boxShadow: `0 0 30px ${bodyColor}44, inset 0 0 20px ${bodyColor}11`,
        }}
      >
        {/* Header */}
        <div className="inspector-header">
          <div className="inspector-title-row">
            <div
              className="alien-swatch"
              style={{
                background: bodyColor,
                boxShadow: `0 0 12px ${bodyColor}`,
              }}
            />
            <div>
              <h2>Alien Transaction</h2>
              <p className="txid-short">{shortTxid(transaction.txid)}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Data source banner */}
        <div className={`demo-banner ${transaction.dataSource === "live" ? "live-banner" : ""}`}>
          {transaction.dataSource === "live"
            ? `LIVE — Bitcoin Cash mainnet · fetched ${new Date(transaction.fetchedAt).toLocaleTimeString()}`
            : DEMO_LABEL}
        </div>

        {/* Status chips */}
        <div className="chips">
          <span className={`chip ${transaction.confirmed ? "confirmed" : "unconfirmed"}`}>
            {transaction.confirmed ? "Confirmed" : "Unconfirmed (Mempool)"}
          </span>
          <span className="chip category">{transaction.category}</span>
          {transaction.hasCashTokens && (
            <span className="chip token">CashTokens</span>
          )}
          {appearance.isWhale && <span className="chip whale">Whale</span>}
        </div>

        {/* Financial summary */}
        <section className="section">
          <h3>Financial</h3>
          <div className="grid-2">
            <div>
              <label>Total Input</label>
              <value>{formatSats(transaction.totalInputSats)}</value>
            </div>
            <div>
              <label>Total Output</label>
              <value>{formatSats(transaction.totalOutputSats)}</value>
            </div>
            <div>
              <label>Fee</label>
              <value>{formatSats(transaction.feeSats)}</value>
            </div>
            <div>
              <label>Fee Rate</label>
              <value>{transaction.feeRate.toFixed(2)} sat/B</value>
            </div>
            <div>
              <label>Size</label>
              <value>{transaction.size} bytes</value>
            </div>
            <div>
              <label>Version</label>
              <value>{transaction.version}</value>
            </div>
          </div>
        </section>

        {/* Identification */}
        <section className="section">
          <h3>Identification</h3>
          <div className="txid-full">
            <code>{transaction.txid}</code>
            <button onClick={copyTxid} className="copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="meta-row">
            <span>Locktime: {transaction.locktime}</span>
            <span>
              In: {transaction.inputCount} · Out: {transaction.outputCount}
            </span>
          </div>
        </section>

        {/* Outputs */}
        <section className="section">
          <h3>Outputs ({transaction.outputs.length})</h3>
          <div className="list">
            {transaction.outputs.map((out) => (
              <div key={out.index} className="list-item">
                <div className="list-item-header">
                  <span className="idx">#{out.index}</span>
                  <span className="value">{formatSats(out.valueSats)}</span>
                </div>
                {out.address && (
                  <div className="addr">{out.address}</div>
                )}
                {out.cashTokens && (
                  <div className="token-info">
                    Token: {out.cashTokens.amount} of{" "}
                    {out.cashTokens.category.slice(0, 16)}…
                  </div>
                )}
                {out.opReturn && (
                  <div className="opreturn">OP_RETURN: {out.opReturn}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Inputs (collapsed by default for space) */}
        <section className="section">
          <h3>Inputs ({transaction.inputs.length})</h3>
          <div className="list">
            {transaction.inputs.map((inp, i) => (
              <div key={i} className="list-item">
                <div className="list-item-header">
                  <span className="idx">#{i}</span>
                  {inp.valueSats != null && (
                    <span className="value">{formatSats(inp.valueSats)}</span>
                  )}
                </div>
                <div className="addr">
                  {inp.prevTxId.slice(0, 12)}…:{inp.prevOutIndex}
                </div>
                {inp.cashTokens && (
                  <div className="token-info">
                    Token: {inp.cashTokens.amount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="actions">
          <button
            className="action-btn"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? "Hide" : "Show"} Technical
          </button>
          <a
            className="action-btn external"
            href={`https://explorer.bitcoin.com/bch/tx/${transaction.txid}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Open in Explorer ↗
          </a>
        </div>

        {showRaw && (
          <section className="section raw">
            <h3>Technical Notes</h3>
            <p className="note">
              This is demo fixture data. In live mode, raw hex, full scripts,
              and confirmation details will be populated from BCHN / indexed
              providers. Input values for unconfirmed transactions may be
              unavailable until the previous outputs are known.
            </p>
            <pre className="raw-block">
              {JSON.stringify(
                {
                  txid: transaction.txid,
                  category: transaction.category,
                  feeSats: transaction.feeSats,
                  size: transaction.size,
                  hasCashTokens: transaction.hasCashTokens,
                },
                null,
                2
              )}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
