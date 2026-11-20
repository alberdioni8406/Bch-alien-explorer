# BCH Alien Explorer

**Explore the Blockchain. Meet the Aliens.**

An immersive 3D Bitcoin Cash blockchain explorer. Every transaction is an alien; every block is a mothership. Built with React, TypeScript, Three.js / React Three Fiber, and the Web Audio API.

## Current status (Milestone 001 + 002 foundations)

- Procedural aliens generated deterministically from TXID
- Unique sounds per alien (Web Audio API)
- 3D galaxy with camera controls, hover/select interactions
- Transaction inspector panel
- Live mainnet mempool data via public providers (actorforth + fullstack.cash) with clear demo fallback
- Network height + mempool count in HUD
- Mobile-friendly responsive UI

**Demo data is clearly labeled.** Live mode uses real BCH mainnet transactions when public endpoints respond.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Click **Activate Audio** (required by browsers), then click aliens to inspect them and hear their unique sounds.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repository in the [Vercel dashboard](https://vercel.com/new).
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

No environment variables are required for the current public-provider setup.

Alternatively from the CLI:

```bash
npx vercel
```

## Project structure

```
src/
  components/     # Alien, Galaxy, HUD, TransactionInspector
  data/           # Demo fixtures (used when live data unavailable)
  lib/            # Alien generator + Sound engine
  providers/      # Modular blockchain providers (live + fallback)
  types/          # Normalized transaction & network types
  App.tsx         # Main entry
```

## Important notes

- The explorer is **read-only**. No wallet, signing, or broadcasting.
- Public REST endpoints are used (no private RPC keys in the frontend).
- If live data fails (rate limits, outages), the app falls back to labeled demo aliens.
- CashTokens support is present in the type system and classification; full parsing will improve in later milestones.

## Roadmap (from original development plan)

- **M001** First Contact — 3D galaxy, procedural aliens, sounds, inspector (done)
- **M002** Real BCH transactions — live mempool + normalization (foundations done)
- **M003** Mothership system — blocks as motherships
- **M004** Live universe — real-time events, confirmations
- **M005** Production — search, historical, mobile polish, security

## License

MIT (or your preferred license). Built for the Bitcoin Cash community.
