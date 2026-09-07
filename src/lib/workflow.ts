import { BrowserProvider, Contract, type LogDescription } from "ethers";

import AttestGuardAbi from "../abi/AttestGuard.json";
import SourceRiskSignalAbi from "../abi/SourceRiskSignal.json";
import type { ProofData } from "./attestcoin";

export type SourceSignal = {
  transactionHash: string;
  blockNumber: number;
  reporter: string;
  intentId: string;
  subject: string;
  sourceValue: bigint;
  riskScore: number;
  policyVersion: number;
  evidenceHash: string;
};

export type GuardDecision = {
  transactionHash: string;
  intentId: string;
  subject: string;
  sourceValue: bigint;
  riskScore: number;
  policyVersion: number;
  allowed: boolean;
  evidenceHash: string;
  queryId: string;
};

function parseLog(
  contract: Contract,
  log: { topics: string[]; data: string },
  eventName: string,
): LogDescription | null {
  try {
    const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
    return parsed?.name === eventName ? parsed : null;
  } catch {
    return null;
  }
}

function requiredLog(contract: Contract, logs: { topics: string[]; data: string }[], eventName: string) {
  const parsed = logs.map((log) => parseLog(contract, log, eventName)).find(Boolean);
  if (!parsed) {
    throw new Error(`${eventName} event was not found in the transaction receipt`);
  }
  return parsed;
}

export async function createSourceSignal(options: {
  provider: BrowserProvider;
  sourceSignalAddress: string;
  subject: string;
  sourceValue: bigint;
}): Promise<SourceSignal> {
  const signer = await options.provider.getSigner();
  const contract = new Contract(options.sourceSignalAddress, SourceRiskSignalAbi, signer);
  const transaction = await contract.record(options.subject, options.sourceValue);
  const receipt = await transaction.wait();
  if (!receipt || receipt.blockNumber == null) {
    throw new Error("Source transaction did not mine");
  }

  const parsed = requiredLog(contract, receipt.logs, "RiskSignalRecorded");
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    reporter: parsed.args.reporter,
    intentId: parsed.args.intentId,
    subject: parsed.args.subject,
    sourceValue: parsed.args.sourceValue,
    riskScore: Number(parsed.args.riskScore),
    policyVersion: Number(parsed.args.policyVersion),
    evidenceHash: parsed.args.evidenceHash,
  };
}

export async function submitGuardProof(options: {
  provider: BrowserProvider;
  attestGuardAddress: string;
  proof: ProofData;
}): Promise<GuardDecision> {
  const signer = await options.provider.getSigner();
  const contract = new Contract(options.attestGuardAddress, AttestGuardAbi, signer);

  const transaction = await contract.execute(
    0,
    options.proof.chainKey,
    options.proof.headerNumber,
    options.proof.txBytes,
    options.proof.merkleProof.root,
    options.proof.merkleProof.siblings,
    options.proof.continuityProof.lowerEndpointDigest,
    options.proof.continuityProof.roots,
    { gasLimit: 900_000 },
  );
  const receipt = await transaction.wait();
  if (!receipt) {
    throw new Error("Creditcoin verification transaction did not mine");
  }

  const parsed = requiredLog(contract, receipt.logs, "DecisionRecorded");
  return {
    transactionHash: receipt.hash,
    intentId: parsed.args.intentId,
    subject: parsed.args.subject,
    sourceValue: parsed.args.sourceValue,
    riskScore: Number(parsed.args.riskScore),
    policyVersion: Number(parsed.args.policyVersion),
    allowed: parsed.args.allowed,
    evidenceHash: parsed.args.evidenceHash,
    queryId: parsed.args.queryId,
  };
}
