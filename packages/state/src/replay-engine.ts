import type { UnifiedStreamEvent } from "@consequence/stream";
import { resetStoresFromEvents } from "./stream-bindings.js";

export interface ReplayOptions {
  onEvent?: (event: UnifiedStreamEvent, index: number) => void;
  onComplete?: () => void;
}

/** Replays a recorded event log into stores for audit and debugging. */
export class ReplayEngine {
  private index = 0;
  private playing = false;

  constructor(private readonly events: UnifiedStreamEvent[]) {}

  get length(): number {
    return this.events.length;
  }

  get currentIndex(): number {
    return this.index;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  /** Replay all events immediately in order. */
  start(options: ReplayOptions = {}): void {
    this.playing = true;
    this.index = 0;
    resetStoresFromEvents([]);

    for (let i = 0; i < this.events.length; i++) {
      this.index = i;
      const slice = this.events.slice(0, i + 1);
      resetStoresFromEvents(slice);
      options.onEvent?.(this.events[i], i);
    }

    this.index = this.events.length;
    this.playing = false;
    options.onComplete?.();
  }

  stop(): void {
    this.playing = false;
  }

  /** Step forward one event. */
  stepForward(): UnifiedStreamEvent | null {
    if (this.index >= this.events.length) return null;
    const slice = this.events.slice(0, this.index + 1);
    resetStoresFromEvents(slice);
    const event = this.events[this.index];
    this.index++;
    return event;
  }
}
