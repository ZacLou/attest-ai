import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import App from "./App";

describe("Attest AI app", () => {
  it("renders the initial safety state", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Attest AI — Verified Agent Guard",
    );
    expect(
      screen.getByRole("button", { name: "Create verified signal" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Ready. Connect a wallet, enter an intent, then create a source signal.",
    );
  });

  it("supports the live Sepolia and Attestcoin stage while CC3 is pending", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SOURCE_SIGNAL_ADDRESS", "0x7CFC5C06aFfBe46c55b9d5313A9ab2A5faa1a2BD");
    const { default: PartialApp } = await import("./App");

    render(<PartialApp />);

    expect(screen.getByText(/Sepolia and Attestcoin are live/i)).toBeInTheDocument();
    expect(screen.getByText(/Creditcoin CC3 decision is pending/i)).toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
