import { useLedgerStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { MetricRow, SectionHeader } from "./analysis-panel-widgets";
import { formatUsdc, MarketSparkline } from "./ledger-panel-widgets";

function EarningsStack({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>{label}</span>
      <span
        className="font-mono"
        style={{
          color: negative ? tokens.colors.accent.error : tokens.colors.text.secondary,
          fontSize: 11,
          transition: "color 150ms ease",
        }}
      >
        {negative ? `-${formatUsdc(Math.abs(value))}` : formatUsdc(value)}
      </span>
    </div>
  );
}

export function LedgerPanel() {
  const panel = useLedgerStore((s) => s.panel);

  if (!panel) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center"
        style={{ color: tokens.colors.text.muted, fontSize: tokens.typography.fontSize.compact }}
      >
        <span>ConsequenceLedger</span>
        <span className="max-w-xs">
          Economic overlay data will appear here as Ledger events stream in from ConsequenceLedger.
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-auto p-3"
      style={{
        backgroundColor: tokens.colors.background.surface,
        fontSize: tokens.typography.fontSize.compact,
        color: tokens.colors.text.secondary,
      }}
    >
      <SectionHeader>Earnings</SectionHeader>
      <div
        className="mb-3 font-mono"
        style={{
          fontSize: 24,
          color: tokens.colors.text.accent,
          transition: "color 150ms ease",
        }}
      >
        {formatUsdc(panel.projected_earnings_usdc)}
      </div>
      <MetricRow label="CMTE contribution" value={(panel.cmte_contribution_score * 100).toFixed(0) + "%"} />
      <EarningsStack label="Asset valuation" value={panel.asset_valuation} />
      <MetricRow label="Market adjustment" value={panel.market_adjustment.toFixed(3) + "×"} />
      <EarningsStack label="AI compute cost" value={panel.ai_compute_cost} negative />
      <EarningsStack label="Storage cost" value={panel.storage_cost} negative />

      <SectionHeader>Staking</SectionHeader>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded px-2 py-0.5 font-mono"
          style={{
            backgroundColor: tokens.colors.accent.doctor,
            color: tokens.colors.text.accent,
            fontSize: 11,
          }}
        >
          Tier {panel.staking.tier} · {panel.staking.tier_name}
        </span>
      </div>
      <MetricRow label="Stake multiplier" value={panel.staking.stake_multiplier.toFixed(2) + "×"} />
      <MetricRow
        label="Discovery weight"
        value={(panel.staking.discovery_placement_weight * 100).toFixed(0) + "%"}
      />
      <MetricRow label="Promo slots" value={String(panel.staking.promotional_slots)} />
      <p className="mt-2" style={{ color: tokens.colors.text.muted, fontSize: 10, lineHeight: 1.4 }}>
        Staking affects discovery visibility and payout multiplier on ConsequenceLedger. It does not
        influence CMTE musical analysis.
      </p>

      <SectionHeader>Market</SectionHeader>
      <MetricRow label="Polygon adjustment" value={panel.market_adjustment.toFixed(3)} />
      <p className="mb-2" style={{ color: tokens.colors.text.muted, fontSize: 10 }}>
        Polygon market context factor applied to session earnings projection.
      </p>
      <MarketSparkline values={panel.market_history_24h} />

      <SectionHeader>Settlement</SectionHeader>
      {panel.settlements.map((settlement) => (
        <div
          key={settlement.date}
          className="mb-2 rounded p-2"
          style={{ backgroundColor: tokens.colors.background.elevated }}
        >
          <div className="mb-1 font-mono" style={{ color: tokens.colors.text.primary, fontSize: 11 }}>
            {settlement.date}
          </div>
          <MetricRow label="Gross" value={formatUsdc(settlement.gross_usdc)} />
          <MetricRow label="Deductions" value={formatUsdc(-settlement.deductions_usdc)} />
          <MetricRow label="Net" value={formatUsdc(settlement.net_usdc)} />
        </div>
      ))}
    </div>
  );
}
