import { describe, it, expect, beforeEach } from "vitest";
import { UnifiedStream } from "@consequence/stream";
import { transportEvent, cmteFrame, ledgerUpdate } from "@consequence/stream";
import { bindStoresToStream } from "./stream-bindings.js";
import { useSessionStore } from "./session-store.js";
import { useAnalysisStore } from "./analysis-store.js";
import { useLedgerStore } from "./ledger-store.js";

describe("stream-bindings", () => {
  beforeEach(() => {
    useSessionStore.setState({
      tempo: 120,
      timeSignature: [4, 4],
      isPlaying: false,
      positionTicks: 0,
    });
    useAnalysisStore.setState({
      key: null,
      mode: null,
      chord: null,
      romanNumeral: null,
      tension: 0,
      confidence: 0,
    });
    useLedgerStore.setState({
      projectedEarningsUsdc: 0,
      cmteContributionScore: 0,
      assetValuation: 0,
      marketAdjustment: 1,
      aiComputeCost: 0,
      storageCost: 0,
      ledger: null,
    });
  });

  it("updates stores when stream events arrive", () => {
    const stream = new UnifiedStream();
    const unbind = bindStoresToStream(stream);

    stream.emit(transportEvent);
    expect(useSessionStore.getState().tempo).toBe(128);

    stream.emit(cmteFrame);
    expect(useAnalysisStore.getState().key).toBe("C");

    stream.emit(ledgerUpdate);
    expect(useLedgerStore.getState().projectedEarningsUsdc).toBe(12.45);

    unbind();
  });
});
