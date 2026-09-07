import { getAddress, keccak256, solidityPacked } from "ethers";

export const POLICY_VERSION = 1;
export const RISK_THRESHOLD = 60;

const HIGH_VALUE_THRESHOLD = 50_000_000_000_000_000n;
const VERY_HIGH_VALUE_THRESHOLD = 500_000_000_000_000_000n;

export type RiskExplanation = {
  score: number;
  allowed: boolean;
  reasons: string[];
};

export function computeRiskScore(reporter: string, subject: string, sourceValue: bigint): number {
  const normalizedReporter = getAddress(reporter);
  const normalizedSubject = getAddress(subject);
  let score = 20;

  if (sourceValue > HIGH_VALUE_THRESHOLD) score += 30;
  if (sourceValue > VERY_HIGH_VALUE_THRESHOLD) score += 30;
  if (normalizedSubject === normalizedReporter) score += 15;
  if (sourceValue === 0n) score += 10;

  return Math.min(score, 100);
}

export function explainRisk(reporter: string, subject: string, sourceValue: bigint): RiskExplanation {
  const normalizedReporter = getAddress(reporter);
  const normalizedSubject = getAddress(subject);
  const reasons: string[] = ["Baseline policy score is 20."];

  if (sourceValue > VERY_HIGH_VALUE_THRESHOLD) {
    reasons.push("Value is above 0.5 ETH, adding 60 points in total across value tiers.");
  } else if (sourceValue > HIGH_VALUE_THRESHOLD) {
    reasons.push("Value is above 0.05 ETH, adding 30 points.");
  }

  if (normalizedSubject === normalizedReporter) {
    reasons.push("The action sends to the signer, which reduces recipient diversity and adds 15 points.");
  }

  if (sourceValue === 0n) {
    reasons.push("The action has zero value, adding 10 points because it may be a metadata-only signal.");
  }

  const score = computeRiskScore(reporter, subject, sourceValue);
  return {
    score,
    allowed: score <= RISK_THRESHOLD,
    reasons,
  };
}

export function computeEvidenceHash(
  reporter: string,
  subject: string,
  sourceValue: bigint,
  riskScore: number,
): string {
  return keccak256(
    solidityPacked(
      ["uint8", "address", "address", "uint256", "uint8"],
      [POLICY_VERSION, getAddress(reporter), getAddress(subject), sourceValue, riskScore],
    ),
  );
}
