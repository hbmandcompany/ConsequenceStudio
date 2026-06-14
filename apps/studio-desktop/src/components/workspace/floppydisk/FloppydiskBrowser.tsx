import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FloppydiskAssetFilter } from "@consequence/state";
import {
  filterAssetsByType,
  FLOPPYDISK_CARD_HEIGHT,
  useFloppydiskStore,
  useWorkspaceStore,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { runFloppydiskSearch } from "../floppydisk-actions";
import { FloppydiskAssetCard } from "./FloppydiskAssetCard";

const FILTERS: { id: FloppydiskAssetFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "midi_fragment", label: "MIDI Fragments" },
  { id: "sample", label: "Samples" },
  { id: "embedding", label: "Embeddings" },
  { id: "dataset", label: "Datasets" },
];

export function FloppydiskBrowser() {
  const open = useWorkspaceStore((s) => s.floppydiskBrowserOpen);
  const closeFloppydiskBrowser = useWorkspaceStore((s) => s.closeFloppydiskBrowser);
  const query = useFloppydiskStore((s) => s.query);
  const assetFilter = useFloppydiskStore((s) => s.assetFilter);
  const results = useFloppydiskStore((s) => s.results);
  const isSearching = useFloppydiskStore((s) => s.isSearching);
  const searchError = useFloppydiskStore((s) => s.searchError);
  const setQuery = useFloppydiskStore((s) => s.setQuery);
  const setAssetFilter = useFloppydiskStore((s) => s.setAssetFilter);

  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const filtered = useMemo(
    () => filterAssetsByType(results, assetFilter),
    [results, assetFilter],
  );

  const virtualWindow = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / FLOPPYDISK_CARD_HEIGHT) - 2);
    const visibleCount = Math.ceil(viewportHeight / FLOPPYDISK_CARD_HEIGHT) + 4;
    const end = Math.min(filtered.length, start + visibleCount);
    return { start, end, topSpacer: start * FLOPPYDISK_CARD_HEIGHT, bottomSpacer: (filtered.length - end) * FLOPPYDISK_CARD_HEIGHT };
  }, [filtered.length, scrollTop, viewportHeight]);

  useEffect(() => {
    if (!open) return;
    void runFloppydiskSearch(query);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void runFloppydiskSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFloppydiskBrowser();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeFloppydiskBrowser]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !open) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  const onScroll = useCallback(() => {
    if (!listRef.current) return;
    setScrollTop(listRef.current.scrollTop);
  }, []);

  if (!open) return null;

  return (
    <aside
      style={{
        position: "absolute",
        top: tokens.spacing.transportBarHeight,
        left: 0,
        bottom: tokens.spacing.statusBarHeight,
        width: tokens.spacing.floppydiskPanelWidth,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.colors.background.elevated,
        borderRight: `1px solid ${tokens.colors.border.active}`,
        boxShadow: tokens.colors.shadow.floating,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: `transform ${tokens.animations.duration.normal}s cubic-bezier(0.4, 0, 0.2, 1)`,
        fontFamily: tokens.typography.fontFamily.ui,
      }}
      aria-label="Floppydisk browser"
    >
      <div
        className="flex shrink-0 items-center justify-between px-3"
        style={{
          height: 40,
          borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        }}
      >
        <span
          style={{
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.primary,
          }}
        >
          Floppydisk
        </span>
        <button
          type="button"
          onClick={closeFloppydiskBrowser}
          style={{
            border: "none",
            background: "transparent",
            color: tokens.colors.text.secondary,
            cursor: "pointer",
            fontSize: tokens.typography.fontSize.compact,
          }}
        >
          Close
        </button>
      </div>

      <div className="shrink-0 px-3 pt-3">
        <input
          type="text"
          value={query}
          placeholder="Search assets by meaning…"
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: tokens.typography.fontSize.body,
            color: tokens.colors.text.primary,
            backgroundColor: tokens.colors.background.surface,
            border: `1px solid ${tokens.colors.border.standard}`,
            borderRadius: tokens.borderRadius.sm,
            outline: "none",
          }}
        />
      </div>

      <div
        className="flex shrink-0 gap-1 overflow-x-auto px-3 py-2"
        style={{ borderBottom: `1px solid ${tokens.colors.border.hairline}` }}
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setAssetFilter(filter.id)}
            style={{
              flexShrink: 0,
              padding: "4px 8px",
              fontSize: tokens.typography.fontSize.xs,
              color: assetFilter === filter.id ? tokens.colors.text.accent : tokens.colors.text.secondary,
              backgroundColor: assetFilter === filter.id ? tokens.colors.background.modal : "transparent",
              border: `1px solid ${assetFilter === filter.id ? tokens.colors.border.active : tokens.colors.border.hairline}`,
              borderRadius: tokens.borderRadius.sm,
              cursor: "pointer",
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
        onScroll={onScroll}
      >
        {isSearching ? (
          <div style={{ fontSize: tokens.typography.fontSize.compact, color: tokens.colors.text.muted }}>
            Searching…
          </div>
        ) : null}
        {searchError ? (
          <div style={{ fontSize: tokens.typography.fontSize.compact, color: tokens.colors.accent.error }}>
            {searchError}
          </div>
        ) : null}
        {!isSearching && filtered.length === 0 ? (
          <div style={{ fontSize: tokens.typography.fontSize.compact, color: tokens.colors.text.muted }}>
            No assets found
          </div>
        ) : null}

        <div style={{ height: virtualWindow.topSpacer }} />
        {filtered.slice(virtualWindow.start, virtualWindow.end).map((asset) => (
          <div key={asset.asset_id} style={{ marginBottom: 10 }}>
            <FloppydiskAssetCard asset={asset} />
          </div>
        ))}
        <div style={{ height: virtualWindow.bottomSpacer }} />
      </div>
    </aside>
  );
}
