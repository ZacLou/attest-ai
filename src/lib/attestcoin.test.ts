import { afterEach, describe, expect, it, vi } from "vitest";

import { getAttestedHeight, getProof, waitForSourceAttestation } from "./attestcoin";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("attestcoin client", () => {
  it("reads the current attested height", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ attestedHeight: 123 })),
    );
    await expect(getAttestedHeight()).resolves.toBe(123);
  });

  it("returns immediately once the target height is attested", async () => {
    const onProgress = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ attestedHeight: 200 })),
    );
    await expect(waitForSourceAttestation(150, { onProgress })).resolves.toBe(200);
    expect(onProgress).toHaveBeenCalledWith(200);
  });

  it("validates proof shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ chainKey: 1 })));
    await expect(getProof("0x" + "0".repeat(64))).rejects.toThrow("invalid proof shape");
  });

  it("returns a valid proof", async () => {
    const proof = {
      chainKey: 1,
      headerNumber: 100,
      txBytes: "0x00",
      continuityProof: { lowerEndpointDigest: "0x02", roots: ["0x03"] },
      merkleProof: { root: "0x04", siblings: [{ hash: "0x05", isLeft: true }] },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(proof)));
    await expect(getProof("0x" + "0".repeat(64))).resolves.toEqual(proof);
  });
});
