import { tokens } from "../design-system/tokens.js";

interface StakingTierBadgeProps {
  tier: number;
  tierName: string;
}

export function StakingTierBadge({ tier, tierName }: StakingTierBadgeProps) {
  return (
    <span
      style={{
        fontSize: tokens.typography.fontSize.sm,
        fontFamily: tokens.typography.fontFamily.ui,
        color: tokens.colors.text.secondary,
        border: `1px solid ${tokens.colors.border.standard}`,
        borderRadius: tokens.borderRadius.xs,
        padding: "2px 6px",
      }}
    >
      Tier {tier} · {tierName}
    </span>
  );
}
