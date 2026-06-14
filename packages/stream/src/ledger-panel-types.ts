/** Staking tier metadata from ConsequenceLedger. */
export interface LedgerStakingInfo {
  tier: 0 | 1 | 2 | 3 | 4;
  tier_name: string;
  stake_multiplier: number;
  discovery_placement_weight: number;
  promotional_slots: number;
}

export interface LedgerSettlement {
  date: string;
  gross_usdc: number;
  deductions_usdc: number;
  net_usdc: number;
}

/** Full Ledger panel snapshot for Studio UI. */
export interface LedgerPanelSnapshot {
  projected_earnings_usdc: number;
  cmte_contribution_score: number;
  asset_valuation: number;
  market_adjustment: number;
  ai_compute_cost: number;
  storage_cost: number;
  staking: LedgerStakingInfo;
  market_history_24h: number[];
  settlements: LedgerSettlement[];
}

export const STAKING_TIER_NAMES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "Starter",
  1: "Creator",
  2: "Producer",
  3: "Studio",
  4: "Maestro",
};
