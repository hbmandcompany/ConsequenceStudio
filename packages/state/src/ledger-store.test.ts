import { describe, it, expect, beforeEach } from "vitest";
import { ledgerUpdate } from "@consequence/stream";
import { useLedgerStore } from "./ledger-store.js";

describe("ledger-store", () => {
  beforeEach(() => {
    useLedgerStore.setState({
      projectedEarningsUsdc: 0,
      cmteContributionScore: 0,
      assetValuation: 0,
      marketAdjustment: 1,
      aiComputeCost: 0,
      storageCost: 0,
      ledger: null,
      panel: null,
      marketHistory24h: [],
    });
  });

  it("projects ledger panel snapshot from reconstruction payload", () => {
    if (ledgerUpdate.event_type !== "ledger_update_event") throw new Error("fixture");
    useLedgerStore.getState().syncFromReconstruction(ledgerUpdate.payload);
    const state = useLedgerStore.getState();
    expect(state.projectedEarningsUsdc).toBe(12.45);
    expect(state.panel?.staking.tier_name).toBe("Studio");
    expect(state.panel?.settlements).toHaveLength(3);
    expect(state.marketHistory24h).toHaveLength(24);
  });
});
