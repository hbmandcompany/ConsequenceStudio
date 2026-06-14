import { create } from "zustand";
import type { LedgerPanelSnapshot, LedgerUpdatePayload } from "@consequence/stream";
import { projectLedgerPanel } from "@consequence/stream";

export interface LedgerState {
  projectedEarningsUsdc: number;
  cmteContributionScore: number;
  assetValuation: number;
  marketAdjustment: number;
  aiComputeCost: number;
  storageCost: number;
  ledger: LedgerUpdatePayload | null;
  panel: LedgerPanelSnapshot | null;
  marketHistory24h: number[];
}

export interface LedgerActions {
  syncFromReconstruction: (ledger: LedgerUpdatePayload) => void;
}

export const useLedgerStore = create<LedgerState & LedgerActions>((set, get) => ({
  projectedEarningsUsdc: 0,
  cmteContributionScore: 0,
  assetValuation: 0,
  marketAdjustment: 1,
  aiComputeCost: 0,
  storageCost: 0,
  ledger: null,
  panel: null,
  marketHistory24h: [],
  syncFromReconstruction: (ledger) => {
    const history = ledger.market_history_24h
      ? ledger.market_history_24h.slice(-24)
      : [...get().marketHistory24h, ledger.market_adjustment].slice(-24);
    const panel = projectLedgerPanel(ledger, { market_history: history });
    set({
      ledger,
      panel,
      marketHistory24h: panel.market_history_24h,
      projectedEarningsUsdc: ledger.projected_earnings_usdc,
      cmteContributionScore: ledger.cmte_contribution_score,
      assetValuation: ledger.asset_valuation,
      marketAdjustment: ledger.market_adjustment,
      aiComputeCost: ledger.ai_compute_cost,
      storageCost: ledger.storage_cost,
    });
  },
}));
