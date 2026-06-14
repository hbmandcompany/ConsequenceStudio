import type { FloppydiskAsset } from "@consequence/stream";
import {
  ASSET_TYPE_LABELS,
  FLOPPYDISK_DRAG_MIME,
  formatAssetSize,
  serializeAssetDragPayload,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { FloppydiskPreview } from "./FloppydiskPreview";

interface FloppydiskAssetCardProps {
  asset: FloppydiskAsset;
}

export function FloppydiskAssetCard({ asset }: FloppydiskAssetCardProps) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(FLOPPYDISK_DRAG_MIME, serializeAssetDragPayload(asset));
        event.dataTransfer.effectAllowed = "copy";
      }}
      style={{
        width: 340,
        padding: 12,
        borderRadius: tokens.borderRadius.md,
        backgroundColor: tokens.colors.background.surface,
        border: `1px solid ${tokens.colors.border.standard}`,
        cursor: "grab",
      }}
    >
      <div className="flex items-start gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: tokens.typography.fontSize.body,
              color: tokens.colors.text.primary,
              fontWeight: tokens.typography.fontWeight.medium,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {asset.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.text.accent,
                backgroundColor: tokens.colors.background.elevated,
                border: `1px solid ${tokens.colors.border.standard}`,
                borderRadius: tokens.borderRadius.xs,
                padding: "1px 6px",
              }}
            >
              {ASSET_TYPE_LABELS[asset.asset_type]}
            </span>
            <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.secondary }}>
              {formatAssetSize(asset.size_bytes)}
            </span>
            <span
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.accent.stable,
                fontFamily: tokens.typography.fontFamily.mono,
              }}
              title="Filecoin CID"
            >
              ⬡ {asset.filecoin_cid.slice(0, 8)}
            </span>
          </div>
        </div>
        <span
          aria-hidden
          style={{
            fontSize: tokens.typography.fontSize.compact,
            color: tokens.colors.text.muted,
            lineHeight: 1,
            paddingTop: 2,
          }}
        >
          ⠿
        </span>
      </div>
      <div className="mt-2">
        <FloppydiskPreview asset={asset} />
      </div>
    </div>
  );
}
