import { describe, expect, it } from "vitest";

import { CREDITCOIN_CC3_TESTNET } from "./chains";

describe("Creditcoin CC3 testnet configuration", () => {
  it("matches the official public network parameters", () => {
    expect(CREDITCOIN_CC3_TESTNET.chainId).toBe(102031);
    expect(CREDITCOIN_CC3_TESTNET.hexChainId).toBe("0x18e8f");
    expect(CREDITCOIN_CC3_TESTNET.nativeCurrency.symbol).toBe("tCTC");
    expect(CREDITCOIN_CC3_TESTNET.blockExplorerUrls).toContain(
      "https://creditcoin-testnet.blockscout.com",
    );
  });
});
