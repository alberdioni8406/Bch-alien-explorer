/**
 * DEMO DATA — Clearly labeled as fixtures until real BCH integration is verified.
 * These are illustrative examples inspired by real BCH transaction shapes.
 * TXIDs are deterministic hashes for procedural generation testing only.
 */

export type AlienCategory =
  | "regular"
  | "whale"
  | "token"
  | "multi-output"
  | "complex"
  | "unconfirmed";

export interface DemoOutput {
  index: number;
  valueSats: number;
  address?: string;
  lockingScript?: string;
  cashTokens?: {
    category: string;
    amount: string;
  };
  opReturn?: string;
}

export interface DemoInput {
  prevTxId: string;
  prevOutIndex: number;
  valueSats?: number;
  unlockingScript?: string;
  cashTokens?: {
    category: string;
    amount: string;
  };
}

export interface DemoTransaction {
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
  feeRate: number; // sats/byte
  totalInputSats: number;
  totalOutputSats: number;
  inputCount: number;
  outputCount: number;
  hasCashTokens: boolean;
  category: AlienCategory;
  inputs: DemoInput[];
  outputs: DemoOutput[];
  rawHex?: string;
  // For 3D placement
  position?: [number, number, number];
}

// Deterministic fake TXIDs (64 hex chars) for procedural testing
const DEMO_TXS: DemoTransaction[] = [
  {
    txid: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    version: 2,
    locktime: 0,
    size: 226,
    confirmed: false,
    feeSats: 450,
    feeRate: 1.99,
    totalInputSats: 1000000,
    totalOutputSats: 999550,
    inputCount: 1,
    outputCount: 2,
    hasCashTokens: false,
    category: "unconfirmed",
    inputs: [
      {
        prevTxId: "0000000000000000000000000000000000000000000000000000000000000001",
        prevOutIndex: 0,
        valueSats: 1000000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 500000,
        address: "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
      },
      {
        index: 1,
        valueSats: 499550,
        address: "bitcoincash:qr95sy3j9xwd2ap32xkykttrhc8hs7erdvq6xqk5m5",
      },
    ],
    position: [-8, 2, -12],
  },
  {
    txid: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    version: 2,
    locktime: 0,
    size: 512,
    confirmed: false,
    feeSats: 1200,
    feeRate: 2.34,
    totalInputSats: 5500000000, // ~55 BCH whale
    totalOutputSats: 5499998800,
    inputCount: 3,
    outputCount: 4,
    hasCashTokens: false,
    category: "whale",
    inputs: [
      {
        prevTxId: "1111111111111111111111111111111111111111111111111111111111111111",
        prevOutIndex: 0,
        valueSats: 2000000000,
      },
      {
        prevTxId: "2222222222222222222222222222222222222222222222222222222222222222",
        prevOutIndex: 1,
        valueSats: 2000000000,
      },
      {
        prevTxId: "3333333333333333333333333333333333333333333333333333333333333333",
        prevOutIndex: 0,
        valueSats: 1500000000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 2000000000,
        address: "bitcoincash:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqfnhks201",
      },
      {
        index: 1,
        valueSats: 1500000000,
        address: "bitcoincash:qpppppppppppppppppppppppppppppppppqgx8r8v7",
      },
      {
        index: 2,
        valueSats: 1000000000,
        address: "bitcoincash:qzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzq7v0s0",
      },
      {
        index: 3,
        valueSats: 99998800,
        address: "bitcoincash:qrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrq0p0p0",
      },
    ],
    position: [10, -1, -8],
  },
  {
    txid: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
    version: 2,
    locktime: 0,
    size: 340,
    confirmed: false,
    feeSats: 680,
    feeRate: 2.0,
    totalInputSats: 250000,
    totalOutputSats: 249320,
    inputCount: 1,
    outputCount: 2,
    hasCashTokens: true,
    category: "token",
    inputs: [
      {
        prevTxId: "4444444444444444444444444444444444444444444444444444444444444444",
        prevOutIndex: 0,
        valueSats: 250000,
        cashTokens: {
          category: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcd",
          amount: "1000",
        },
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 100000,
        address: "bitcoincash:qtokenrecipient00000000000000000000000000",
        cashTokens: {
          category: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcd",
          amount: "1000",
        },
      },
      {
        index: 1,
        valueSats: 149320,
        address: "bitcoincash:qchangeaddress00000000000000000000000000",
      },
    ],
    position: [-5, 4, 5],
  },
  {
    txid: "d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab",
    version: 2,
    locktime: 0,
    size: 890,
    confirmed: false,
    feeSats: 1800,
    feeRate: 2.02,
    totalInputSats: 5000000,
    totalOutputSats: 4998200,
    inputCount: 2,
    outputCount: 8,
    hasCashTokens: false,
    category: "multi-output",
    inputs: [
      {
        prevTxId: "5555555555555555555555555555555555555555555555555555555555555555",
        prevOutIndex: 0,
        valueSats: 3000000,
      },
      {
        prevTxId: "6666666666666666666666666666666666666666666666666666666666666666",
        prevOutIndex: 2,
        valueSats: 2000000,
      },
    ],
    outputs: Array.from({ length: 8 }, (_, i) => ({
      index: i,
      valueSats: i === 7 ? 4998200 - 7 * 500000 : 500000,
      address: `bitcoincash:qmultiout${i.toString().padStart(2, "0")}000000000000000000000`,
    })),
    position: [6, 3, 10],
  },
  {
    txid: "e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcd",
    version: 2,
    locktime: 0,
    size: 412,
    confirmed: false,
    feeSats: 820,
    feeRate: 1.99,
    totalInputSats: 750000,
    totalOutputSats: 749180,
    inputCount: 2,
    outputCount: 3,
    hasCashTokens: false,
    category: "complex",
    inputs: [
      {
        prevTxId: "7777777777777777777777777777777777777777777777777777777777777777",
        prevOutIndex: 0,
        valueSats: 400000,
        unlockingScript: "OP_0 OP_IF ... complex ... OP_ENDIF",
      },
      {
        prevTxId: "8888888888888888888888888888888888888888888888888888888888888888",
        prevOutIndex: 1,
        valueSats: 350000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 300000,
        address: "bitcoincash:qcomplex0000000000000000000000000000000",
      },
      {
        index: 1,
        valueSats: 200000,
        lockingScript: "OP_RETURN 48656c6c6f20424348",
        opReturn: "Hello BCH",
      },
      {
        index: 2,
        valueSats: 249180,
        address: "bitcoincash:qchangecomplex00000000000000000000000",
      },
    ],
    position: [-12, -2, 3],
  },
  {
    txid: "f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef",
    version: 1,
    locktime: 0,
    size: 192,
    confirmed: false,
    feeSats: 350,
    feeRate: 1.82,
    totalInputSats: 100000,
    totalOutputSats: 99650,
    inputCount: 1,
    outputCount: 1,
    hasCashTokens: false,
    category: "regular",
    inputs: [
      {
        prevTxId: "9999999999999999999999999999999999999999999999999999999999999999",
        prevOutIndex: 0,
        valueSats: 100000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 99650,
        address: "bitcoincash:qregular000000000000000000000000000000",
      },
    ],
    position: [0, 1, -5],
  },
  {
    txid: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    version: 2,
    locktime: 0,
    size: 278,
    confirmed: false,
    feeSats: 560,
    feeRate: 2.01,
    totalInputSats: 2500000,
    totalOutputSats: 2499440,
    inputCount: 1,
    outputCount: 2,
    hasCashTokens: false,
    category: "regular",
    inputs: [
      {
        prevTxId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        prevOutIndex: 0,
        valueSats: 2500000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 1500000,
        address: "bitcoincash:qanotherregular0000000000000000000000",
      },
      {
        index: 1,
        valueSats: 999440,
        address: "bitcoincash:qchangeanother00000000000000000000000",
      },
    ],
    position: [4, -3, -15],
  },
  {
    txid: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    version: 2,
    locktime: 0,
    size: 650,
    confirmed: false,
    feeSats: 1500,
    feeRate: 2.31,
    totalInputSats: 120000000, // 1.2 BCH
    totalOutputSats: 119998500,
    inputCount: 4,
    outputCount: 5,
    hasCashTokens: true,
    category: "token",
    inputs: [
      {
        prevTxId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        prevOutIndex: 0,
        valueSats: 30000000,
      },
      {
        prevTxId: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        prevOutIndex: 0,
        valueSats: 30000000,
        cashTokens: {
          category: "token-category-example-0000000000000000000000000001",
          amount: "50000",
        },
      },
      {
        prevTxId: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        prevOutIndex: 1,
        valueSats: 30000000,
      },
      {
        prevTxId: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        prevOutIndex: 0,
        valueSats: 30000000,
      },
    ],
    outputs: [
      {
        index: 0,
        valueSats: 40000000,
        address: "bitcoincash:qtokendest000000000000000000000000000",
        cashTokens: {
          category: "token-category-example-0000000000000000000000000001",
          amount: "50000",
        },
      },
      {
        index: 1,
        valueSats: 20000000,
        address: "bitcoincash:qoutput20000000000000000000000000000",
      },
      {
        index: 2,
        valueSats: 20000000,
        address: "bitcoincash:qoutput30000000000000000000000000000",
      },
      {
        index: 3,
        valueSats: 20000000,
        address: "bitcoincash:qoutput40000000000000000000000000000",
      },
      {
        index: 4,
        valueSats: 19998500,
        address: "bitcoincash:qchange5000000000000000000000000000",
      },
    ],
    position: [-3, 5, -3],
  },
];

export function getDemoTransactions(): DemoTransaction[] {
  return DEMO_TXS;
}

export function getDemoTransaction(txid: string): DemoTransaction | undefined {
  return DEMO_TXS.find((t) => t.txid === txid);
}

export const IS_DEMO_MODE = true;
export const DEMO_LABEL = "DEMO DATA — Not live Bitcoin Cash mainnet transactions";
