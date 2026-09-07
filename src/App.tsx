import { useMemo, useState } from "react";
import { formatEther, getAddress, isAddress, parseEther } from "ethers";

import {
  getProof,
  waitForSourceAttestation,
  type ProofData,
} from "./lib/attestcoin";
import {
  ATTEST_GUARD_ADDRESS,
  DEPLOYMENT_READY,
  SOURCE_SIGNAL_ADDRESS,
} from "./lib/deployment";
import { explainRisk, RISK_THRESHOLD } from "./lib/risk";
import {
  createSourceSignal,
  submitGuardProof,
  type GuardDecision,
  type SourceSignal,
} from "./lib/workflow";
import { connectWallet, ensureCreditcoin, ensureSepolia, type Eip1193Provider } from "./lib/wallet";

type WorkflowStatus =
  | "idle"
  | "source-signing"
  | "waiting-attestation"
  | "proof-ready"
  | "target-signing"
  | "confirmed";

const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

function shortHash(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function transactionUrl(baseUrl: string, transactionHash: string): string {
  return `${baseUrl.replace(/\/$/, "")}/tx/${transactionHash}`;
}

export default function App() {
  const [status, setStatus] = useState<WorkflowStatus>("idle");
  const [address, setAddress] = useState<string | null>(null);
  const [injected, setInjected] = useState<Eip1193Provider | null>(null);
  const [subject, setSubject] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [error, setError] = useState<string | null>(null);
  const [sourceSignal, setSourceSignal] = useState<SourceSignal | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [decision, setDecision] = useState<GuardDecision | null>(null);
  const [latestAttestedHeight, setLatestAttestedHeight] = useState<number | null>(null);

  const subjectIsValid = subject.length > 0 && isAddress(subject);
  const amountIsValid = amountPattern.test(amount);
  const sourceValue = useMemo(
    () => (amountIsValid ? parseEther(amount) : null),
    [amount, amountIsValid],
  );
  const riskPreview = useMemo(() => {
    if (!address || !subjectIsValid || sourceValue == null) return null;
    return explainRisk(address, subject, sourceValue);
  }, [address, sourceValue, subject, subjectIsValid]);

  async function handleConnectWallet() {
    setError(null);
    try {
      const connected = await connectWallet();
      setAddress(connected.address);
      setInjected(connected.provider as unknown as Eip1193Provider);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Wallet connection failed.");
    }
  }

  async function waitAndFetchProof(signal: SourceSignal) {
    setStatus("waiting-attestation");
    setProof(null);
    setLatestAttestedHeight(null);

    const attestedHeight = await waitForSourceAttestation(signal.blockNumber, {
      onProgress: setLatestAttestedHeight,
      timeoutMs: 20 * 60 * 1000,
    });
    setLatestAttestedHeight(attestedHeight);

    const fetchedProof = await getProof(signal.transactionHash);
    if (fetchedProof.headerNumber < signal.blockNumber) {
      throw new Error("Proof builder returned a proof for the wrong source block.");
    }
    setProof(fetchedProof);
    setStatus("proof-ready");
  }

  async function handleCreateSignal() {
    if (!injected || !address || !subjectIsValid || sourceValue == null) return;
    setError(null);
    setDecision(null);
    setSourceSignal(null);
    setProof(null);
    setStatus("source-signing");

    try {
      const provider = await ensureSepolia(injected);
      const signal = await createSourceSignal({
        provider,
        sourceSignalAddress: SOURCE_SIGNAL_ADDRESS,
        subject: getAddress(subject),
        sourceValue,
      });
      setSourceSignal(signal);
      await waitAndFetchProof(signal);
    } catch (signalError) {
      setError(signalError instanceof Error ? signalError.message : "Source signal failed.");
      setStatus(sourceSignal ? "waiting-attestation" : "idle");
    }
  }

  async function handleSubmitProof() {
    if (!injected || !proof || !sourceSignal) return;
    setError(null);
    setStatus("target-signing");

    try {
      const provider = await ensureCreditcoin(injected);
      const result = await submitGuardProof({
        provider,
        attestGuardAddress: ATTEST_GUARD_ADDRESS,
        proof,
      });
      if (result.intentId !== sourceSignal.intentId) {
        throw new Error("Creditcoin decision does not match the submitted source intent.");
      }
      setDecision(result);
      setStatus("confirmed");
    } catch (proofError) {
      setError(proofError instanceof Error ? proofError.message : "Creditcoin verification failed.");
      setStatus("proof-ready");
    }
  }

  function resetWorkflow() {
    setStatus("idle");
    setSourceSignal(null);
    setProof(null);
    setDecision(null);
    setLatestAttestedHeight(null);
    setError(null);
  }

  const busy =
    status === "source-signing" ||
    status === "waiting-attestation" ||
    status === "target-signing";
  const canCreateSignal =
    Boolean(injected && subjectIsValid && sourceValue != null && DEPLOYMENT_READY) && !busy && status !== "confirmed";

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Attestcoin Protocol · Creditcoin CC3 Testnet</p>
        <h1>Attest AI — Verified Agent Guard</h1>
        <p className="hero-copy">
          Deterministic AI policy, cryptographically proven source-chain signals, and a testnet
          decision registry. No centralized oracle, no backend, no private-key custody.
        </p>
      </header>

      <section className="wallet-panel" aria-labelledby="wallet-heading">
        <div>
          <h2 id="wallet-heading">Operator wallet</h2>
          <p>{address ? `${shortHash(address)} · ${getAddress(address)}` : "Not connected"}</p>
        </div>
        <div className="wallet-actions">
          <button type="button" onClick={handleConnectWallet}>
            {address ? "Refresh account" : "Connect wallet"}
          </button>
          {address ? (
            <button type="button" onClick={resetWorkflow} disabled={busy}>
              New decision
            </button>
          ) : null}
        </div>
      </section>

      <div className="workspace">
        <section className="panel" aria-labelledby="intent-heading">
          <h2 id="intent-heading">1. Agent intent</h2>
          <label htmlFor="subject">Action recipient address</label>
          <input
            id="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={subject.length > 0 && !subjectIsValid}
            aria-describedby="subject-help"
          />
          <p id="subject-help" className={subject.length > 0 && !subjectIsValid ? "error-text" : "help-text"}>
            Use a valid 0x address. This is the subject that the CC3 decision will authorize or deny.
          </p>

          <label htmlFor="amount">Notional action value (ETH)</label>
          <input
            id="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            aria-invalid={!amountIsValid}
            aria-describedby="amount-help"
          />
          <p id="amount-help" className={!amountIsValid ? "error-text" : "help-text"}>
            Up to 18 decimal places. Value only feeds the deterministic risk policy; the app never transfers ETH.
          </p>

          {riskPreview ? (
            <article className={`risk-card ${riskPreview.allowed ? "safe" : "unsafe"}`}>
              <div>
                <span>Policy v1 score</span>
                <strong>{riskPreview.score}/100</strong>
              </div>
              <div>
                <span>Decision threshold</span>
                <strong>{riskPreview.allowed ? "Allow" : "Deny"} at ≤{RISK_THRESHOLD}</strong>
              </div>
              <ul>
                {riskPreview.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>
          ) : null}

          <div className="primary-actions">
            <button
              type="button"
              onClick={handleCreateSignal}
              disabled={!canCreateSignal}
            >
              {status === "source-signing" ? "Signing on Sepolia…" : "Create verified signal"}
            </button>
            {status === "proof-ready" ? (
              <button type="button" onClick={handleSubmitProof}>
                Verify on Creditcoin
              </button>
            ) : null}
          </div>

          {!DEPLOYMENT_READY ? (
            <p className="warning-text">
              Testnet contracts are not configured yet. Deploy contracts first, then set the two
              Vite address variables.
            </p>
          ) : null}
        </section>

        <section className="panel workflow-panel" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading">2. Verification pipeline</h2>
          <ol className="workflow">
            <li data-state={sourceSignal ? "done" : status === "source-signing" ? "active" : "todo"}>
              Sepolia signal
              {sourceSignal ? (
                <>
                  <span>{shortHash(sourceSignal.transactionHash)}</span>
                  <a href={transactionUrl("https://sepolia.etherscan.io", sourceSignal.transactionHash)}>
                    View source transaction
                  </a>
                </>
              ) : null}
            </li>
            <li
              data-state={
                proof ? "done" : status === "waiting-attestation" ? "active" : "todo"
              }
            >
              Attestcoin proof
              {status === "waiting-attestation" && sourceSignal ? (
                <span>
                  Waiting for block {sourceSignal.blockNumber}. Latest attested height:{" "}
                  {latestAttestedHeight ?? "checking…"}
                </span>
              ) : proof ? (
                <span>Proof ready for header {proof.headerNumber}</span>
              ) : (
                <span>Waits for source block attestation</span>
              )}
            </li>
            <li data-state={decision ? "done" : status === "target-signing" ? "active" : "todo"}>
              CC3 decision
              {decision ? (
                <>
                  <span>{decision.allowed ? "Allowed" : "Denied"}</span>
                  <a href={transactionUrl("https://explorer.cc3-testnet.creditcoin.network", decision.transactionHash)}>
                    View Creditcoin transaction
                  </a>
                </>
              ) : (
                <span>Verified by the native precompile</span>
              )}
            </li>
          </ol>

          {decision ? (
            <article className={`decision-card ${decision.allowed ? "safe" : "unsafe"}`}>
              <p className="decision-label">Final registry result</p>
              <h3>{decision.allowed ? "Agent action allowed" : "Agent action denied"}</h3>
              <dl>
                <div>
                  <dt>Intent</dt>
                  <dd>{shortHash(decision.intentId)}</dd>
                </div>
                <div>
                  <dt>Score</dt>
                  <dd>
                    {decision.riskScore}/100 · threshold ≤{RISK_THRESHOLD}
                  </dd>
                </div>
                <div>
                  <dt>Value</dt>
                  <dd>{formatEther(decision.sourceValue)} ETH</dd>
                </div>
                <div>
                  <dt>Query ID</dt>
                  <dd>{shortHash(decision.queryId)}</dd>
                </div>
              </dl>
            </article>
          ) : null}
        </section>
      </div>

      <section className="status-panel" aria-live="polite" role="status">
        <h2>Status</h2>
        <p>
          {status === "idle" && "Ready. Connect a wallet, enter an intent, then create a source signal."}
          {status === "source-signing" && "Waiting for your wallet signature on Sepolia."}
          {status === "waiting-attestation" &&
            `Waiting for Attestcoin attestation. This typically takes several minutes.`}
          {status === "proof-ready" && "Proof is ready. Submit it to Creditcoin CC3 Testnet."}
          {status === "target-signing" && "Waiting for your wallet signature on Creditcoin."}
          {status === "confirmed" && "Verified decision recorded on Creditcoin."}
        </p>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
