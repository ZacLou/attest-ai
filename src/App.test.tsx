import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

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
});
