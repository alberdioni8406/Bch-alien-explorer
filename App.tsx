import { useState, useCallback, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Galaxy } from "./components/Galaxy";
import { TransactionInspector } from "./components/TransactionInspector";
import { HUD } from "./components/HUD";
import { providerManager } from "./providers/ProviderManager";
import type { NormalizedTransaction } from "./types/blockchain";
import { soundEngine } from "./lib/soundEngine";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [selected, setSelected] = useState<NormalizedTransaction | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [audioActivated, setAudioActivated] = useState(false);
  const [dataMode, setDataMode] = useState<"live" | "demo" | "mixed" | "loading">("loading");
  const [statusMessage, setStatusMessage] = useState("Connecting to Bitcoin Cash…");
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<{blockHeight: number; mempoolTxCount: number} | null>(null);

  // Initial load + periodic refresh of mempool
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage("Fetching mempool aliens…");
      const result = await providerManager.loadMempoolAliens(20);
      if (cancelled) return;
      setTransactions(result.transactions);
      setDataMode(result.mode);
      setStatusMessage(result.message);
      setLoading(false);
      // Network observatory data
      providerManager.getNetworkStats().then((s) => {
        if (s && !cancelled) setNetworkStats({ blockHeight: s.blockHeight, mempoolTxCount: s.mempoolTxCount });
      });
    }

    load();

    // Refresh every 45s in live mode
    const interval = setInterval(() => {
      if (providerManager.getMode() === "live") {
        load();
      }
    }, 45000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleSelect = useCallback((tx: NormalizedTransaction) => {
    setSelected(tx);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelected(null);
  }, []);

  const activateAudio = useCallback(() => {
    const ok = soundEngine.activate();
    if (ok) {
      setAudioActivated(true);
      soundEngine.playBlockDiscovery();
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setStatusMessage("Refreshing…");
    const result = await providerManager.loadMempoolAliens(20);
    setTransactions(result.transactions);
    setDataMode(result.mode);
    setStatusMessage(result.message);
    setLoading(false);
  }, []);

  return (
    <div className="app-root">
      <HUD
        alienCount={transactions.length}
        selectedCount={selected ? 1 : 0}
        onActivateAudio={activateAudio}
        audioActivated={audioActivated}
        dataMode={dataMode}
        statusMessage={statusMessage}
        loading={loading}
        onRefresh={handleRefresh}
        networkStats={networkStats}
      />

      <div className="canvas-wrap">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => setSelected(null)}
        >
          <PerspectiveCamera makeDefault position={[0, 6, 22]} fov={55} />
          <Suspense fallback={null}>
            <Galaxy
              transactions={transactions}
              selectedTxid={selected?.txid ?? null}
              onSelectAlien={handleSelect}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          </Suspense>
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={6}
            maxDistance={55}
            maxPolarAngle={Math.PI * 0.85}
            target={[0, 0, 0]}
            makeDefault
          />
        </Canvas>
      </div>

      <TransactionInspector
        transaction={selected}
        onClose={handleCloseInspector}
      />
    </div>
  );
}

export default App;
