# DoraHacks Submission Checklist

## Required assets

- [x] Project name: Attest AI — Verified Agent Guard
- [x] AI track
- [x] GitHub repository: `https://github.com/ZacLou/attest-ai`
- [x] Source code: contracts, frontend, tests, scripts, and evidence
- [x] GitHub push: final accepted commit on public `main`
- [x] Technical README with setup and verification commands
- [x] Product specification: `docs/PRODUCT_SPEC.md`
- [x] Project brief PDF: `output/pdf/Attest-AI-Project-Brief.pdf`
- [x] BUIDL logo: `output/image/attest-ai-logo-480.png`
- [x] DoraHacks form draft: `docs/DORAHACKS_FORM_DRAFT.md`
- [x] Deployed application URL: `https://attest-ai-livid.vercel.app`
- [ ] Demo video (after final end-to-end run)

## Chain evidence

- [x] Sepolia source contract: `0x7CFC5C06aFfBe46c55b9d5313A9ab2A5faa1a2BD`
- [x] Sepolia deployment transaction: `0x0bc6fbe5979818906e1587fa32112a999afff19c5f87bb72470cab54e047ca22`
- [x] High-risk source event: `docs/evidence/high-risk-source.json`
- [x] High-risk Attestcoin proof: `docs/evidence/high-risk-proof.json`
- [x] Low-risk source event: `docs/evidence/low-risk-source.json`
- [x] Low-risk Attestcoin proof: `docs/evidence/low-risk-proof.json`
- [ ] CC3 `AttestGuard` deployment transaction
- [ ] Low-risk CC3 allow-record transaction
- [ ] Low-risk CC3 decision evidence: `docs/evidence/low-risk-decision.json`
- [x] High-risk CC3 deny-record intent and proof data
- [ ] High-risk CC3 deny-record transaction
- [ ] High-risk CC3 decision evidence: `docs/evidence/high-risk-decision.json`

## Verification gates

- [x] TypeScript strict type check
- [x] React and application tests: 11 passing
- [x] Production Vite build
- [x] Foundry contract tests: 13 passing
- [x] PDF visual review at 6 pages
- [x] Responsive app review at 1280px, 768px, and 390px
- [x] Public Vercel deployment review without login
- [ ] Full browser end-to-end flow with wallet signature
- [ ] Final `npm run verify` after CC3 addresses are configured

## Demo recording script

1. Open the deployed URL and introduce the operator problem in one sentence.
2. Connect the EVM wallet and confirm the address is visible.
3. Enter the low-risk recipient `0x0000000000000000000000000000000000001000` and value `0.01`.
4. Explain the score 20 and all policy reasons.
5. Sign the Sepolia signal; show the Sepolia transaction link.
6. Show the Attestcoin attestation wait, proof header, and official proof response.
7. Switch to CC3 Testnet and sign the guard verification.
8. Show the final allowed `DecisionRecorded`, intent, query ID, and explorer link.
9. Start a new intent with value `0.6`, explain score 80, and repeat the flow to show denial.
10. End with the trust summary: deterministic policy, Attestcoin proof, CC3 public registry, no oracle.

## Final handoff

- Confirm the GitHub repository is public after the DoraHacks draft is complete.
- Re-run `npm run verify` and record the output.
- Confirm all links in README and the DoraHacks form use final testnet transactions.
- Confirm the demo video includes both allow and deny flows and reads clearly at 1080p.
