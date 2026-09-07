export const PROOF_BUILDER_URL = "https://prover.cc3-testnet.creditcoin.network";
export const SOURCE_CHAIN_KEY = 1;

export type ProofSibling = {
  hash: string;
  isLeft: boolean;
};

export type ProofData = {
  chainKey: number;
  headerNumber: number;
  txIndex?: number;
  txHash?: string;
  txBytes: string;
  continuityProof: {
    lowerEndpointDigest: string;
    roots: string[];
  };
  merkleProof: {
    root: string;
    siblings: ProofSibling[];
  };
  cached?: boolean;
  generatedAt?: string;
};

async function fetchJson<T>(input: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAttestedHeight(chainKey = SOURCE_CHAIN_KEY): Promise<number> {
  const result = await fetchJson<{ attestedHeight?: number }>(
    `${PROOF_BUILDER_URL}/api/v1/attested-height/${chainKey}`,
  );
  if (typeof result.attestedHeight !== "number" || !Number.isFinite(result.attestedHeight)) {
    throw new Error("Proof builder returned an invalid attested height");
  }
  return result.attestedHeight;
}

export async function waitForSourceAttestation(
  targetHeight: number,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    onProgress?: (latestAttestedHeight: number) => void;
  } = {},
): Promise<number> {
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const pollIntervalMs = options.pollIntervalMs ?? 15_000;
  const startedAt = Date.now();

  for (;;) {
    const latestAttestedHeight = await getAttestedHeight();
    options.onProgress?.(latestAttestedHeight);

    if (latestAttestedHeight >= targetHeight) {
      return latestAttestedHeight;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(
        `Timed out waiting for source block ${targetHeight}; latest attested height is ${latestAttestedHeight}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

function assertProofShape(data: unknown): asserts data is ProofData {
  const proof = data as Partial<ProofData>;
  if (
    typeof proof.chainKey !== "number" ||
    typeof proof.headerNumber !== "number" ||
    typeof proof.txBytes !== "string" ||
    !proof.continuityProof ||
    typeof proof.continuityProof.lowerEndpointDigest !== "string" ||
    !Array.isArray(proof.continuityProof.roots) ||
    !proof.merkleProof ||
    typeof proof.merkleProof.root !== "string" ||
    !Array.isArray(proof.merkleProof.siblings)
  ) {
    throw new Error("Proof builder returned an invalid proof shape");
  }
}

export async function getProof(transactionHash: string, chainKey = SOURCE_CHAIN_KEY): Promise<ProofData> {
  const data = await fetchJson<unknown>(
    `${PROOF_BUILDER_URL}/api/v1/proof-by-tx/${chainKey}/${transactionHash}`,
    30_000,
  );
  assertProofShape(data);
  if (data.chainKey !== chainKey) {
    throw new Error(`Proof chain key does not match: expected ${chainKey}, received ${data.chainKey}`);
  }
  return data;
}
