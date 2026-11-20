import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  generateAlienAppearance,
  hslToHex,
  type AlienAppearance,
} from "../lib/alienGenerator";
import type { NormalizedTransaction } from "../types/blockchain";
import { soundEngine } from "../lib/soundEngine";

interface AlienProps {
  transaction: NormalizedTransaction;
  selected: boolean;
  onSelect: (tx: NormalizedTransaction) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

export function Alien({
  transaction,
  selected,
  onSelect,
  hoveredId,
  setHoveredId,
}: AlienProps) {
  const groupRef = useRef<THREE.Group>(null);
  const appearance = useMemo(
    () => generateAlienAppearance(transaction),
    [transaction.txid]
  );
  const [localHover, setLocalHover] = useState(false);

  const isHovered = hoveredId === transaction.txid || localHover;
  const isSelected = selected;

  // Materials
  const bodyColor = useMemo(
    () =>
      hslToHex(
        appearance.bodyHue,
        appearance.bodySaturation,
        appearance.bodyLightness
      ),
    [appearance]
  );
  const accentColor = useMemo(
    () => hslToHex(appearance.accentHue, 80, 55),
    [appearance]
  );
  const eyeColor = useMemo(
    () => hslToHex(appearance.eyeHue, 90, 60),
    [appearance]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const { idleSpeed, bobAmount, rotationSpeed } = appearance;

    // Idle bob + slight rotation
    groupRef.current.position.y =
      (transaction.position?.[1] ?? 0) +
      Math.sin(t * idleSpeed + transaction.txid.charCodeAt(0)) * bobAmount;

    groupRef.current.rotation.y = t * rotationSpeed * 0.3;

    // Scale pulse on hover/select
    const targetScale = isSelected
      ? appearance.bodyScale * 1.35
      : isHovered
      ? appearance.bodyScale * 1.15
      : appearance.bodyScale;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    );
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setLocalHover(true);
    setHoveredId(transaction.txid);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setLocalHover(false);
    setHoveredId(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!soundEngine.isActivated()) {
      soundEngine.activate();
    }
    soundEngine.playSelect(
      transaction.txid,
      appearance.isWhale
        ? "whale"
        : appearance.isToken
        ? "token"
        : transaction.category === "multi-output"
        ? "multi"
        : "select"
    );
    onSelect(transaction);
  };

  // Simple procedural geometry using primitives
  return (
    <group
      ref={groupRef}
      position={transaction.position ?? [0, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Body core */}
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.6, 4, 8]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={appearance.glowIntensity * 0.35}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={appearance.glowIntensity * 0.25}
          roughness={0.3}
        />
      </mesh>

      {/* Eyes */}
      {Array.from({ length: appearance.eyeCount }).map((_, i) => {
        const angle =
          (i / appearance.eyeCount) * Math.PI * 1.2 - Math.PI * 0.6;
        const x = Math.sin(angle) * 0.22;
        const y = 0.55 + Math.cos(angle * 0.5) * 0.08;
        const z = 0.22;
        return (
          <mesh key={`eye-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[appearance.eyeSize * 0.18, 8, 8]} />
            <meshStandardMaterial
              color={eyeColor}
              emissive={eyeColor}
              emissiveIntensity={1.2}
            />
          </mesh>
        );
      })}

      {/* Antennae */}
      {Array.from({ length: appearance.antennaCount }).map((_, i) => {
        const angle = (i / Math.max(appearance.antennaCount, 1)) * Math.PI - Math.PI / 2;
        return (
          <group key={`ant-${i}`} position={[Math.sin(angle) * 0.15, 0.8, 0]}>
            <mesh>
              <cylinderGeometry
                args={[0.02, 0.015, appearance.antennaLength * 0.5, 6]}
              />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0, appearance.antennaLength * 0.28, 0]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        );
      })}

      {/* Arms */}
      {Array.from({ length: appearance.armCount }).map((_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const yOff = Math.floor(i / 2) * 0.18 - 0.1;
        return (
          <mesh
            key={`arm-${i}`}
            position={[side * 0.38, yOff, 0]}
            rotation={[0, 0, side * 0.4]}
          >
            <capsuleGeometry
              args={[appearance.limbThickness * 0.7, 0.35, 3, 6]}
            />
            <meshStandardMaterial color={bodyColor} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Legs */}
      {Array.from({ length: appearance.legCount }).map((_, i) => {
        const t = (i / Math.max(appearance.legCount - 1, 1)) * 0.5 - 0.25;
        return (
          <mesh key={`leg-${i}`} position={[t, -0.55, 0.05]}>
            <capsuleGeometry
              args={[appearance.limbThickness * 0.8, 0.3, 3, 6]}
            />
            <meshStandardMaterial color={bodyColor} roughness={0.45} />
          </mesh>
        );
      })}

      {/* Spikes */}
      {appearance.hasSpikes &&
        Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={`spike-${i}`}
              position={[Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28]}
              rotation={[0.4, a, 0]}
            >
              <coneGeometry args={[0.06, 0.22, 5]} />
              <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={0.4}
              />
            </mesh>
          );
        })}

      {/* Wings (whale / special) */}
      {appearance.hasWings && (
        <>
          <mesh position={[-0.55, 0.15, -0.1]} rotation={[0.2, 0, 0.6]}>
            <planeGeometry args={[0.7, 0.35]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.3}
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
            />
          </mesh>
          <mesh position={[0.55, 0.15, -0.1]} rotation={[0.2, 0, -0.6]}>
            <planeGeometry args={[0.7, 0.35]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.3}
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
            />
          </mesh>
        </>
      )}

      {/* Tail */}
      {appearance.hasTail && (
        <mesh position={[0, -0.35, -0.4]} rotation={[0.8, 0, 0]}>
          <capsuleGeometry args={[0.06, 0.45, 3, 6]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      )}

      {/* Selection / hover glow ring */}
      {(isHovered || isSelected) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial
            color={isSelected ? "#00ff88" : "#aa44ff"}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Category badge light */}
      {appearance.isWhale && (
        <pointLight
          position={[0, 0.8, 0]}
          color="#ff8800"
          intensity={1.5}
          distance={3}
        />
      )}
      {appearance.isToken && (
        <pointLight
          position={[0, 0.5, 0.5]}
          color="#cc44ff"
          intensity={1.2}
          distance={2.5}
        />
      )}
    </group>
  );
}
