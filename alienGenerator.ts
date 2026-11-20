/**
 * Procedural Alien Generator
 * Deterministic visual identity derived from TXID.
 * Same TXID always produces the same alien appearance.
 */

import type { AlienCategory, NormalizedTransaction } from "../types/blockchain";

export interface AlienAppearance {
  // Body
  bodyHue: number; // 0-360
  bodySaturation: number;
  bodyLightness: number;
  bodyScale: number;
  bodySegments: number;
  
  // Head / Face
  eyeCount: number;
  eyeSize: number;
  eyeHue: number;
  antennaCount: number;
  antennaLength: number;
  mouthStyle: number; // 0-3
  
  // Limbs
  armCount: number;
  legCount: number;
  limbThickness: number;
  
  // Features
  hasSpikes: boolean;
  hasWings: boolean;
  hasTail: boolean;
  glowIntensity: number;
  
  // Category-driven overrides
  category: AlienCategory;
  isWhale: boolean;
  isToken: boolean;
  
  // Animation seeds
  idleSpeed: number;
  bobAmount: number;
  rotationSpeed: number;
  
  // Color accents
  accentHue: number;
  neonIntensity: number;
}

/** Simple deterministic PRNG from a string seed (TXID) */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function generateAlienAppearance(tx: NormalizedTransaction): AlienAppearance {
  const rand = seededRandom(tx.txid);
  
  // Base randoms
  const bodyHue = range(rand, 80, 160); // neon greens / cyans dominant
  const accentHue = range(rand, 260, 320); // purple/violet
  const bodyScale = range(rand, 0.7, 1.4);
  
  // Influence by transaction properties
  let scaleBoost = 1;
  if (tx.totalOutputSats > 10_000_00000) scaleBoost = 1.8; // >10 BCH
  else if (tx.totalOutputSats > 1_000_00000) scaleBoost = 1.4; // >1 BCH
  else if (tx.totalOutputSats > 100_00000) scaleBoost = 1.15; // >0.1 BCH
  
  const feeInfluence = Math.min(tx.feeRate / 5, 1.5);
  
  const appearance: AlienAppearance = {
    bodyHue: tx.hasCashTokens ? range(rand, 280, 320) : bodyHue,
    bodySaturation: range(rand, 60, 95),
    bodyLightness: range(rand, 40, 65),
    bodyScale: bodyScale * scaleBoost,
    bodySegments: Math.floor(range(rand, 2, 6)),
    
    eyeCount: Math.floor(range(rand, 1, 5)),
    eyeSize: range(rand, 0.15, 0.45),
    eyeHue: range(rand, 0, 60), // warm eyes
    antennaCount: Math.floor(range(rand, 0, 4)),
    antennaLength: range(rand, 0.4, 1.2),
    mouthStyle: Math.floor(range(rand, 0, 4)),
    
    armCount: Math.floor(range(rand, 2, 6)),
    legCount: Math.floor(range(rand, 2, 5)),
    limbThickness: range(rand, 0.08, 0.22),
    
    hasSpikes: rand() > 0.55,
    hasWings: tx.category === "whale" || rand() > 0.75,
    hasTail: rand() > 0.4,
    glowIntensity: range(rand, 0.3, 1.0) * (tx.category === "token" ? 1.4 : 1),
    
    category: tx.category,
    isWhale: tx.category === "whale" || tx.totalOutputSats > 5_000_00000,
    isToken: tx.hasCashTokens,
    
    idleSpeed: range(rand, 0.6, 1.8),
    bobAmount: range(rand, 0.08, 0.25),
    rotationSpeed: range(rand, 0.1, 0.5) * (tx.feeRate > 3 ? 1.3 : 1),
    
    accentHue,
    neonIntensity: range(rand, 0.5, 1.2) * feeInfluence,
  };
  
  // Category specific tweaks
  if (appearance.isWhale) {
    appearance.bodyScale *= 1.6;
    appearance.glowIntensity = Math.min(appearance.glowIntensity * 1.3, 1.5);
    appearance.hasWings = true;
  }
  if (appearance.isToken) {
    appearance.bodyHue = range(rand, 270, 310);
    appearance.neonIntensity *= 1.25;
  }
  if (tx.category === "multi-output") {
    appearance.armCount = Math.max(appearance.armCount, 4);
    appearance.eyeCount = Math.max(appearance.eyeCount, 3);
  }
  if (tx.category === "complex") {
    appearance.hasSpikes = true;
    appearance.bodySegments = Math.max(appearance.bodySegments, 4);
  }
  if (tx.category === "unconfirmed") {
    appearance.glowIntensity *= 0.85;
    appearance.bodyLightness = Math.min(appearance.bodyLightness + 10, 75);
  }
  
  return appearance;
}

/** Convert HSL to hex for materials */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
