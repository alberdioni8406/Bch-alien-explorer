import { soundEngine } from "../lib/soundEngine";
import { useState, useEffect } from "react";

interface HUDProps {
  alienCount: number;
  selectedCount: number;
  onActivateAudio: () => void;
  audioActivated: boolean;
  dataMode: "live" | "demo" | "mixed" | "loading";
  statusMessage: string;
  loading: boolean;
  onRefresh: () => void;
  networkStats?: { blockHeight: number; mempoolTxCount: number } | null;
}

export function HUD({
  alienCount,
  selectedCount,
  onActivateAudio,
  audioActivated,
  dataMode,
  statusMessage,
  loading,
  onRefresh,
  networkStats,
}: HUDProps) {
  const [muted, setMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(0.7);

  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    soundEngine.setVolume("master", masterVol);
  }, [masterVol]);

  return (
    <>
      <header className="hud-top">
        <div className="brand">
          <span className="logo-glyph">◈</span>
          <div>
            <h1>BCH Alien Explorer</h1>
            <p className="tagline">Explore the Blockchain. Meet the Aliens.</p>
          </div>
        </div>
        <div className="hud-stats">
          <div className="stat">
            <span className="stat-label">Aliens</span>
            <span className="stat-value">{alienCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Height</span>
            <span className="stat-value">{networkStats?.blockHeight ? networkStats.blockHeight.toLocaleString() : "—"}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Mempool</span>
            <span className="stat-value">{networkStats?.mempoolTxCount ?? "—"}</span>
          </div>
          <div className="stat network">
            <span className="stat-label">Network</span>
            <span className="stat-value">BCH Mainnet</span>
          </div>
        </div>
      </header>

      <div
        className={`demo-mode-banner ${
          dataMode === "live" ? "live" : dataMode === "loading" ? "loading" : ""
        }`}
      >
        <span className="pulse-dot" />
        <span>{statusMessage}</span>
        {dataMode !== "loading" && (
          <button
            className="refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh mempool"
          >
            ↻
          </button>
        )}
      </div>

      <footer className="hud-bottom">
        <div className="hint">
          Click an alien to inspect · Drag to orbit · Scroll to zoom
        </div>
        <div className="audio-controls">
          {!audioActivated ? (
            <button className="audio-activate" onClick={onActivateAudio}>
              🔊 Activate Audio
            </button>
          ) : (
            <>
              <button
                className={`mute-btn ${muted ? "muted" : ""}`}
                onClick={() => setMuted((m) => !m)}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={masterVol}
                onChange={(e) => setMasterVol(parseFloat(e.target.value))}
                className="vol-slider"
                title="Master volume"
              />
            </>
          )}
        </div>
      </footer>
    </>
  );
}
