import type { LedgerPanelSnapshot, LedgerSettlement, LedgerStakingInfo } from "./ledger-panel-types.js";
import type { LedgerUpdatePayload } from "./types.js";

const TIER_NAMES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "Starter",
  1: "Creator",
  2: "Producer",
  3: "Studio",
  4: "Maestro",
};

function tierFromContribution(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score >= 0.82) return 4;
  if (score >= 0.62) return 3;
  if (score >= 0.42) return 2;
  if (score >= 0.22) return 1;
  return 0;
}

function buildStaking(payload: LedgerUpdatePayload): LedgerStakingInfo {
  if (payload.staking) return payload.staking;
  const tier = tierFromContribution(payload.cmte_contribution_score);
  const multipliers = [1, 1.15, 1.35, 1.6, 2];
  const weights = [0.4, 0.55, 0.7, 0.85, 1];
  const slots = [0, 1, 2, 4, 8];
  return {
    tier,
    tier_name: TIER_NAMES[tier],
    stake_multiplier: multipliers[tier],
    discovery_placement_weight: weights[tier],
    promotional_slots: slots[tier],
  };
}

function defaultSettlements(payload: LedgerUpdatePayload): LedgerSettlement[] {
  if (payload.settlements && payload.settlements.length > 0) {
    return payload.settlements.slice(0, 3);
  }
  const net = payload.projected_earnings_usdc;
  const deductions = Math.abs(payload.ai_compute_cost) + Math.abs(payload.storage_cost);
  return [
    {
      date: new Date().toISOString().slice(0, 10),
      gross_usdc: net + deductions,
      deductions_usdc: deductions,
      net_usdc: net,
    },
  ];
}

function buildMarketHistory(
  payload: LedgerUpdatePayload,
  previous: number[],
): number[] {
  const seed = payload.market_history_24h ?? previous;
  if (seed.length > 0) return seed.slice(-24);
  const base = payload.market_adjustment;
  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin(index * 0.55) * 0.04;
    return Math.max(0.85, Math.min(1.2, base + wave));
  });
}

/** Project a Ledger update into the Studio Ledger panel snapshot. */
export function projectLedgerPanel(
  payload: LedgerUpdatePayload,
  context: { market_history?: number[] } = {},
): LedgerPanelSnapshot {
  const market_history_24h = buildMarketHistory(payload, context.market_history ?? []);
  return {
    projected_earnings_usdc: payload.projected_earnings_usdc,
    cmte_contribution_score: payload.cmte_contribution_score,
    asset_valuation: payload.asset_valuation,
    market_adjustment: payload.market_adjustment,
    ai_compute_cost: payload.ai_compute_cost,
    storage_cost: payload.storage_cost,
    staking: buildStaking(payload),
    market_history_24h,
    settlements: defaultSettlements(payload),
  };
}
