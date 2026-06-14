import { describe, it, expect } from "vitest";
import { projectLedgerPanel } from "./ledger-panel-projection.js";

const basePayload = {
  projected_earnings_usdc: 12.45,
  cmte_contribution_score: 0.78,
  asset_valuation: 4.2,
  market_adjustment: 1.05,
  ai_compute_cost: -0.32,
  storage_cost: -0.08,
};

describe("projectLedgerPanel", () => {
  it("builds earnings, staking, market history, and settlements", () => {
    const panel = projectLedgerPanel(basePayload);
    expect(panel.projected_earnings_usdc).toBe(12.45);
    expect(panel.staking.tier).toBe(3);
    expect(panel.staking.tier_name).toBe("Studio");
    expect(panel.market_history_24h).toHaveLength(24);
    expect(panel.settlements.length).toBeGreaterThan(0);
  });

  it("appends market history from context", () => {
    const first = projectLedgerPanel({ ...basePayload, market_adjustment: 1.0 });
    const second = projectLedgerPanel(
      { ...basePayload, market_adjustment: 1.08 },
      { market_history: [...first.market_history_24h.slice(0, 23), 1.08] },
    );
    expect(second.market_history_24h.at(-1)).toBe(1.08);
  });
});
