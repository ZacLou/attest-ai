# DoraHacks BUIDL Form Draft

## BUIDL profile

- **Name:** Attest AI — Verified Agent Guard
- **Logo:** `output/image/attest-ai-logo-480.png`
- **Category:** Crypto / Web3
- **Track:** AI
- **GitHub:** `https://github.com/ZacLou/attest-ai`
- **Website:** pending Vercel deployment
- **Demo video:** pending final end-to-end recording
- **Social link:** `https://t.me/zacshare`

## Vision

AI agents are increasingly allowed to trigger payments and infrastructure actions, but operators cannot prove what evidence the agent acted on. Mutable logs and LLM explanations do not survive an audit. Attest AI turns a proposed agent action into a versioned deterministic risk policy, writes the policy result as a signed event on Sepolia, proves that exact event with the Attestcoin Protocol, and records a public allow/deny decision on Creditcoin CC3 Testnet. The result is a verified agent guard with no centralized oracle, no backend, and no private-key custody.

## Why this is different

- The trust anchor is an Attestcoin inclusion and continuity proof, not an LLM claim.
- The risk policy is deterministic, versioned, and implemented consistently in TypeScript and Solidity.
- The CC3 contract recomputes the risk score and evidence hash from the proven event.
- The app fails closed on failed receipts, untrusted emitters, malformed topics, duplicate intents, and tampered scores or hashes.
- The final decision is stored in a public mapping and emitted as `DecisionRecorded`, so auditors do not need to trust the frontend.

## Submission evidence

- Sepolia source contract and deployment transaction are linked in the README.
- High-risk and low-risk source events and official Attestcoin proofs are stored under `docs/evidence/`.
- CC3 deployment and both final decisions will be appended to the README immediately after the official Discord faucet funds the dedicated test wallet.
- The demo will show both an allowed 0.01 ETH action and a denied 0.6 ETH action in one complete recording.

## Final submission checklist

1. Confirm Discord has funded the CC3 test wallet with official test CTC.
2. Deploy `AttestGuard`, register the trusted source, and copy the public address into `.env` and Vite variables.
3. Run both official proof submissions and save the final CC3 transactions.
4. Deploy the frontend to Vercel.
5. Record the 2-3 minute demo at 1080p.
6. Push the final repository state to GitHub.
7. Submit the BUIDL on DoraHacks.
8. Verify that the project appears under the event and all links open correctly.
