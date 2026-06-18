import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { tokens } from "@consequence/ui/design-system";

type UpdatePhase = "idle" | "available" | "installing" | "error";

interface PendingUpdate {
  version: string;
  notes?: string | null;
  install: () => Promise<void>;
}

export function AppUpdateBanner() {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [pending, setPending] = useState<PendingUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri()) return;

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setPhase("idle");
        setPending(null);
        return;
      }

      setPending({
        version: update.version,
        notes: update.body,
        install: async () => {
          setPhase("installing");
          setError(null);
          const { relaunch } = await import("@tauri-apps/plugin-process");
          await update.downloadAndInstall();
          await relaunch();
        },
      });
      setPhase("available");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void checkForUpdates();
    const interval = window.setInterval(() => void checkForUpdates(), 4 * 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [checkForUpdates]);

  if (!isTauri() || phase === "idle") return null;

  const bg = tokens.colors.background.elevated;
  const border = tokens.colors.border.standard;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: bg,
        boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
        fontFamily: tokens.typography.fontFamily.ui,
        fontSize: tokens.typography.fontSize.compact,
        color: tokens.colors.text.primary,
        maxWidth: "min(560px, calc(100vw - 24px))",
      }}
    >
      {phase === "available" && pending ? (
        <>
          <span>
            Update available: <strong>v{pending.version}</strong>
            {pending.notes ? ` — ${pending.notes}` : ""}
          </span>
          <button
            type="button"
            onClick={() => void pending.install()}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: tokens.colors.text.accent,
              color: tokens.colors.background.canvas,
              cursor: "pointer",
              fontWeight: tokens.typography.fontWeight.semibold,
              whiteSpace: "nowrap",
            }}
          >
            Install & restart
          </button>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            aria-label="Dismiss update"
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: `1px solid ${border}`,
              background: "transparent",
              color: tokens.colors.text.muted,
              cursor: "pointer",
            }}
          >
            Later
          </button>
        </>
      ) : null}

      {phase === "installing" ? (
        <span>Downloading update…</span>
      ) : null}

      {phase === "error" ? (
        <>
          <span style={{ color: tokens.colors.text.secondary }}>
            Could not check for updates{error ? `: ${error}` : ""}
          </span>
          <button
            type="button"
            onClick={() => void checkForUpdates()}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${border}`,
              background: "transparent",
              color: tokens.colors.text.primary,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </>
      ) : null}
    </div>
  );
}
