# Attest AI Product Specification

## Positioning

Attest AI is a verified agent guard for cross-chain AI workflows. It lets an operator submit a Sepolia transaction, applies a deterministic and explainable risk model, writes the model result to Sepolia as a signed source event, proves that event with the Attestcoin Protocol, and records the resulting decision in a Creditcoin CC3 Testnet contract.

AI is used for explanation and policy composition, not as a trust anchor. Every fact consumed by the target chain is either present in the proven transaction receipt or derived from a deterministic rule that can be replayed from source code.

## Primary user

An AI agent operator who must show auditors that an autonomous action was based on a real source-chain event rather than an oracle's or model's claim.

## End-to-end flow

1. The user connects an EVM wallet and provides the intended recipient and notional value.
2. The client computes a deterministic risk score and displays the reasons.
3. The user signs a `RiskSignalRecorded` event on Sepolia through `SourceRiskSignal`.
4. The client polls the proof builder until the source block is attested.
5. The client requests an Attestcoin proof for that transaction.
6. The user switches to CC3 Testnet and submits the proof to `AttestGuard.execute`.
7. The Creditcoin precompile verifies inclusion and continuity; `AttestGuard` validates the trusted emitter, receipt status, event shape, and duplicate intent.
8. `AttestGuard` emits and stores a `DecisionRecorded` result. The application can then expose or gate the downstream agent action.

## Trust model

- Source fact: proven by Attestcoin's native verifier.
- Model result: deterministic, versioned, and replayable from TypeScript source.
- Off-chain explanation: generated only after verified data is available.
- Target decision: stored on CC3 and independently readable from the contract.
- No backend is required; the browser talks directly to public Sepolia, CC3, and proof-builder endpoints.

## Deterministic risk policy

The initial policy is intentionally transparent:

- Base score: 20.
- Value above 0.05 ETH: +30.
- Value above 0.5 ETH: +30.
- Receiver equals signer: +15.
- A zero-value intent: +10.
- A failed source receipt is rejected during CC3 verification.
- Score at or below 60: allow.
- Score above 60: deny and record the denial for audit.

Scores and thresholds are versioned in the source event so the deployed contract can preserve the policy version used at decision time.

## Acceptance criteria

- Contract tests pass for valid signal, failed receipt, untrusted emitter, malformed event, duplicate intent, and allowed/denied thresholds.
- Unit tests pass for proof normalization, risk scoring, intent IDs, hashing, and network values.
- `npm run build` succeeds.
- The app builds and runs from `README.md` instructions.
- A real Sepolia transaction and CC3 verification transaction are linked in the final submission.
- The demo video shows: wallet connection, risk explanation, source signal creation, attestation wait, proof submission, and on-chain decision.

## Non-goals

- No private-key storage in the app or repository.
- No claim that the language model itself is cryptographically verified.
- No real funds or mainnet execution.
- No centralized oracle or backend in the critical path.
