#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { Contract, JsonRpcProvider, Wallet, formatEther } from "ethers";

import AttestGuardAbi from "../src/abi/AttestGuard.json" with { type: "json" };

function parseArguments(args) {
  let proofFile = null;
  let outputFile = null;

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (option === "--proof" && value) proofFile = value;
    else if (option === "--output" && value) outputFile = value;
    else throw new Error("Usage: node scripts/submit-decision.mjs --proof <file> --output <file>");
  }

  if (!proofFile || !outputFile) {
    throw new Error("Usage: node scripts/submit-decision.mjs --proof <file> --output <file>");
  }

  return { proofFile, outputFile };
}

function requiredEnvironment() {
  const required = [
    "DEPLOYER_PRIVATE_KEY",
    "CREDITCOIN_RPC_URL",
    "ATTEST_GUARD_ADDRESS",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    privateKey: process.env.DEPLOYER_PRIVATE_KEY,
    rpcUrl: process.env.CREDITCOIN_RPC_URL,
    attestGuardAddress: process.env.ATTEST_GUARD_ADDRESS,
  };
}

async function readProof(path) {
  const proof = JSON.parse(await readFile(path, "utf8"));
  const required = [
    "chainKey",
    "headerNumber",
    "txBytes",
    "merkleProof.root",
    "merkleProof.siblings",
    "continuityProof.lowerEndpointDigest",
    "continuityProof.roots",
  ];
  const missing = required.filter((path) => path.split(".").reduce((value, part) => value?.[part], proof) == null);
  if (missing.length > 0) {
    throw new Error(`Proof is missing fields: ${missing.join(", ")}`);
  }
  return proof;
}

const { proofFile, outputFile } = parseArguments(process.argv.slice(2));
const { privateKey, rpcUrl, attestGuardAddress } = requiredEnvironment();
const proof = await readProof(proofFile);

const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);
const balance = await provider.getBalance(wallet.address);
if (balance === 0n) throw new Error("Deployer wallet has no CC3 testnet gas. Request tCTC from the official faucet.");

const contract = new Contract(attestGuardAddress, AttestGuardAbi, wallet);
const transaction = await contract.execute(
  0,
  proof.chainKey,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
  { gasLimit: 900_000 },
);
const receipt = await transaction.wait();
const event = receipt.logs
  .map((log) => {
    try {
      return contract.interface.parseLog(log);
    } catch {
      return null;
    }
  })
  .find((parsed) => parsed?.name === "DecisionRecorded");

if (!event) throw new Error("DecisionRecorded event was not found in the transaction receipt.");

const result = {
  submittedAt: new Date().toISOString(),
  chainId: await provider.getNetwork().then((network) => Number(network.chainId)),
  transactionHash: receipt.hash,
  sourceTransactionHash: proof.txHash,
  blockNumber: receipt.blockNumber,
  operator: wallet.address,
  attestGuardAddress,
  intentId: event.args.intentId,
  subject: event.args.subject,
  sourceValue: event.args.sourceValue.toString(),
  sourceValueEther: formatEther(event.args.sourceValue),
  riskScore: Number(event.args.riskScore),
  policyVersion: Number(event.args.policyVersion),
  allowed: event.args.allowed,
  evidenceHash: event.args.evidenceHash,
  queryId: event.args.queryId,
};

await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o644 });
console.log(`Decision recorded: ${receipt.hash}`);
console.log(`Allowed: ${result.allowed} · Risk score: ${result.riskScore}`);
console.log(`Evidence written: ${outputFile}`);
