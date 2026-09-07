# Attest AI — Verified Agent Guard

Attest AI is a cross-chain AI safety console for Creditcoin's BUIDL CTC 2026 Fall hackathon. It turns an agent intent into a deterministic, explainable risk score, writes that score to Sepolia as an event, proves the event with the Attestcoin Protocol, and records the verified allow/deny decision on Creditcoin CC3 Testnet.

The AI layer is intentionally not the trust anchor. The browser computes a versioned deterministic policy, and the Creditcoin precompile proves the source transaction. This makes the final registry entry independently auditable without trusting a centralized oracle, an LLM, or an app server.

## Current deployment

- Sepolia `SourceRiskSignal`: `0x7CFC5C06aFfBe46c55b9d5313A9ab2A5faa1a2BD`
- Sepolia deployment transaction: `0x0bc6fbe5979818906e1587fa32112a999afff19c5f87bb72470cab54e047ca22`
- Sepolia high-risk signal: `0x6302b379257c1a6aa700b210fd8234b672e4b465805f4d928f3de9555195ce9f`
- Official high-risk proof: `docs/evidence/high-risk-proof.json`
- Sepolia low-risk signal: `0xd9fe599bbf2f870314d2884250359113998c73ed0b473832db0ab7efca853ef4`
- Official low-risk proof: `docs/evidence/low-risk-proof.json`
- CC3 `AttestGuard`: pending testnet gas
- Public proof builder: `https://prover.cc3-testnet.creditcoin.network`
- Public Sepolia RPC: `https://ethereum-sepolia-rpc.publicnode.com`
- Public CC3 RPC: `https://rpc.cc3-testnet.creditcoin.network`

## Product flow

1. The operator connects an EVM wallet.
2. The operator enters the intended recipient and notional value.
3. The browser computes Policy v1 and displays every scoring reason.
4. The operator signs `SourceRiskSignal.record` on Sepolia.
5. The app waits until the source block is attested by Attestcoin.
6. The app requests an inclusion and continuity proof from the official proof builder.
7. The operator submits that proof to `AttestGuard.execute` on CC3 Testnet.
8. The native verifier checks the proof; `AttestGuard` checks the trusted emitter, successful receipt, event shape, policy version, score, evidence hash, and duplicate intent.
9. The final `DecisionRecorded` event and public mapping provide an auditable allow/deny result.

## Deterministic policy

Policy v1 is transparent and identical in TypeScript and Solidity:

- Base score: 20
- Value above 0.05 ETH: +30
- Value above 0.5 ETH: +30
- Recipient equals signer: +15
- Zero-value intent: +10
- Score at or below 60: allow
- Score above 60: deny and record for audit

The source event contains the policy version, score, and evidence hash. The CC3 contract recomputes both score and hash; a tampered event cannot pass.

## Architecture

```text
Browser (React + ethers)
  ├─ Wallet: EIP-1193 provider
  ├─ Sepolia: SourceRiskSignal event
  ├─ Proof Builder: official Attestcoin API
  └─ Creditcoin CC3: AttestGuard + native verifier precompile
```

There is no backend in the critical path. The browser talks directly to public RPC and proof-builder endpoints. The repository contains no private keys and never takes custody of user keys.

## Repository map

- `contracts/SourceRiskSignal.sol` — Sepolia event source and Policy v1
- `contracts/AttestGuard.sol` — CC3 Attestcoin verifier and decision registry
- `src/lib/risk.ts` — browser policy and explanations
- `src/lib/attestcoin.ts` — proof-builder client
- `src/lib/workflow.ts` — source signal and target proof submission
- `src/App.tsx` — operator console
- `test/Policy.t.sol` — cross-contract policy consistency
- `test/AttestGuard.t.sol` — malicious input and decision tests
- `docs/PRODUCT_SPEC.md` — product, trust, and acceptance specification
- `docs/DORAHACKS_FORM_DRAFT.md` — final submission copy and material map
- `docs/evidence/high-risk-proof.json` — official Attestcoin proof for the live high-risk signal
- `docs/evidence/low-risk-source.json` and `docs/evidence/low-risk-proof.json` — live allow-flow evidence
- `scripts/build_project_brief.py` — reproducible submission PDF generator
- `scripts/build_project_logo.py` — reproducible DoraHacks BUIDL logo generator
- `output/pdf/Attest-AI-Project-Brief.pdf` — submission-ready project brief

## Setup

```bash
npm install
cp .env.example .env
```

Fill only the private key for a dedicated test wallet and public contract addresses. Never use a wallet with real funds.

Install Foundry:

```bash
brew install foundry
```

## Verification

```bash
npm run typecheck
npm test
npm run build
forge test
python3 scripts/build_project_brief.py
python3 scripts/build_project_logo.py
```

Current verified results:

- TypeScript/UI tests: 11 passed
- Solidity tests: 13 passed
- Production build: passed
- Project brief PDF: regenerated and visually reviewed
- BUIDL logo: regenerated and visually reviewed

## Deployment

Deploy the Sepolia source contract:

```bash
./scripts/deploy-source.sh
```

Deploy the CC3 guard after funding the dedicated wallet with testnet CTC:

```bash
./scripts/deploy-guard.sh
```

Register the trusted source emitter:

```bash
./scripts/set-trusted-source.sh
```

Copy the public addresses into the Vite variables:

```dotenv
VITE_SOURCE_SIGNAL_ADDRESS=<source contract address>
VITE_ATTEST_GUARD_ADDRESS=<guard contract address>
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Testnet funding

- Sepolia: Google Cloud Web3 Faucet, `https://cloud.google.com/application/web3/faucet/ethereum/sepolia`
- CC3: official Creditcoin Discord `token-faucet` channel, `/faucet address:<EVM address>`

The dedicated deployment wallet currently has Sepolia ETH and is waiting for CC3 testnet CTC.

## Demo script

1. Open the deployed app.
2. Connect an EVM wallet.
3. Enter a valid recipient and a low-risk value such as `0.01`.
4. Show the policy reasons and score.
5. Sign the Sepolia source event.
6. Wait for the attestation and proof.
7. Switch to CC3 Testnet and sign the verification transaction.
8. Show the final `DecisionRecorded` mapping and both explorer links.
9. Repeat with a high-risk value such as `0.6` to show denial.

## Hackathon requirement mapping

- Original Attestcoin integration: native verifier and custom ASC contracts
- Working integration: Sepolia + CC3 Testnet + official proof builder
- Deployed application: Vercel-ready static frontend
- Source code: this repository
- README: this document
- Technical documentation: this document and `docs/PRODUCT_SPEC.md`
- Testnet transactions: source deployment linked above; final source signal and CC3 proof will be linked after full testnet run
- Demo video: pending final end-to-end recording

## Safety

- No private keys, seed phrases, API tokens, or user wallet addresses are committed.
- `.env` is ignored and uses `0600` permissions.
- The app never transfers native ETH; the notional value only feeds the policy.
- All funds and contracts are testnet-only.
- The app does not claim an LLM is cryptographically verified; it verifies the deterministic policy event that the operator signs.

## Known limitations

- CC3 deployment is pending testnet gas from the official Discord faucet.
- Final demo video and Vercel URL will be added after the full end-to-end run.
- The current public CC3 explorer URL may require manual RPC verification for some browsers.
