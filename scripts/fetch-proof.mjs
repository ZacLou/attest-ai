#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";

const proofBuilderUrl = "https://prover.cc3-testnet.creditcoin.network";
const chainKey = 1;

function usage() {
  console.error("Usage: node scripts/fetch-proof.mjs <transaction-hash> <output.json>");
  process.exit(1);
}

async function fetchJson(url, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const [transactionHash, outputFile] = process.argv.slice(2);
if (!transactionHash || !outputFile) usage();

const receipt = await fetchJson(
  `${proofBuilderUrl}/api/v1/proof-by-tx/${chainKey}/${transactionHash}`,
).catch((error) => {
  throw new Error(`Proof not available yet: ${error.message}`);
});

if (receipt.chainKey !== chainKey) {
  throw new Error(`Unexpected chain key: expected ${chainKey}, received ${receipt.chainKey}`);
}
if (!receipt.txBytes || !receipt.merkleProof?.siblings || !receipt.continuityProof?.roots) {
  throw new Error("Proof builder returned an invalid proof shape");
}

await fs.writeFile(outputFile, JSON.stringify(receipt, null, 2) + "\n", "utf8");
console.log(`Proof saved to ${outputFile}`);
console.log(`headerNumber=${receipt.headerNumber}`);
