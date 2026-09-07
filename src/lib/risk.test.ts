import { describe, expect, it } from "vitest";
import { getAddress } from "ethers";

import {
  computeEvidenceHash,
  computeRiskScore,
  explainRisk,
  RISK_THRESHOLD,
} from "./risk";

const reporter = getAddress("0x1111111111111111111111111111111111111111");
const subject = getAddress("0x2222222222222222222222222222222222222222");

describe("risk policy", () => {
  it("keeps ordinary actions below the threshold", () => {
    expect(computeRiskScore(reporter, subject, 10_000_000_000_000_000n)).toBe(20);
  });

  it("scores the mid-value tier", () => {
    expect(computeRiskScore(reporter, subject, 100_000_000_000_000_000n)).toBe(50);
  });

  it("rejects very high value actions", () => {
    expect(computeRiskScore(reporter, subject, 600_000_000_000_000_000n)).toBe(80);
    expect(computeRiskScore(reporter, subject, 600_000_000_000_000_000n)).toBeGreaterThan(RISK_THRESHOLD);
  });

  it("adds self-directed and zero-value penalties", () => {
    expect(computeRiskScore(reporter, reporter, 0n)).toBe(45);
    expect(computeRiskScore(reporter, subject, 0n)).toBe(30);
  });

  it("returns a deterministic evidence hash", () => {
    const evidenceHash = computeEvidenceHash(reporter, subject, 10_000_000_000_000_000n, 20);
    expect(evidenceHash).toHaveLength(66);
    expect(evidenceHash).toBe(
      computeEvidenceHash(reporter, subject, 10_000_000_000_000_000n, 20),
    );
  });

  it("produces an explainable decision", () => {
    const explanation = explainRisk(reporter, subject, 10_000_000_000_000_000n);
    expect(explanation.allowed).toBe(true);
    expect(explanation.reasons[0]).toContain("Baseline policy score");
  });
});
