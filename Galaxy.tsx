import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Stars, Sparkles } from "@react-three/drei";
import { Alien } from "./Alien";
import type { NormalizedTransaction } from "../types/blockchain";

interface GalaxyProps {
  transactions: NormalizedTransaction[];
  selectedTxid: string | null;
  onSelectAlien: (tx: NormalizedTransaction) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

function Nebula() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -30]} scale={[40, 25, 1]}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <meshBasicMaterial
        color="#1a0033"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const count = 120;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#00ff88"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function Galaxy({
  transactions,
  selectedTxid,
  onSelectAlien,
  hoveredId,
  setHoveredId,
}: GalaxyProps) {
  return (
    <>
      {/* Deep space background lighting */}
      <color attach="background" args={["#030008"]} />
      <fog attach="fog" args={["#050010", 25, 70]} />

      <ambientLight intensity={0.25} color="#220033" />
      <directionalLight
        position={[10, 15, 5]}
        intensity={0.6}
        color="#88ffaa"
        castShadow
      />
      <pointLight position={[-15, 5, -10]} intensity={0.8} color="#aa44ff" />
      <pointLight position={[12, -4, 8]} intensity={0.5} color="#00ff88" />

      {/* Stars */}
      <Stars
        radius={80}
        depth={50}
        count={2500}
        factor={3.5}
        saturation={0.3}
        fade
        speed={0.4}
      />

      {/* Sparkles for energy feel */}
      <Sparkles
        count={80}
        scale={40}
        size={2}
        speed={0.3}
        opacity={0.5}
        color="#00ffaa"
      />

      <Nebula />
      <FloatingParticles />

      {/* Soft ground plane / energy field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
        <circleGeometry args={[35, 64]} />
        <meshStandardMaterial
          color="#0a0015"
          emissive="#00ff44"
          emissiveIntensity={0.03}
          transparent
          opacity={0.4}
          roughness={0.9}
        />
      </mesh>

      {/* Grid helper for subtle cyber feel */}
      <gridHelper
        args={[50, 50, "#003322", "#001a11"]}
        position={[0, -7.9, 0]}
      />

      {/* The aliens */}
      {transactions.map((tx) => (
        <Alien
          key={tx.txid}
          transaction={tx}
          selected={selectedTxid === tx.txid}
          onSelect={onSelectAlien}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      ))}
    </>
  );
}
