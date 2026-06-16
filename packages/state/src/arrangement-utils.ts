/** MIDI timing helpers for the arrangement timeline. */

export const TICKS_PER_BEAT = 480;

/** Hard cap on arrangement length, in wall-clock minutes. */
export const MAX_ARRANGEMENT_MINUTES = 5;

/**
 * Maximum number of ticks the arrangement may span, derived from the 5-minute
 * cap. Tempo is in BPM (quarter notes per minute) and TICKS_PER_BEAT is a
 * quarter note, so this is independent of the time signature.
 */
export function maxArrangementTicks(tempo: number): number {
  return Math.round(tempo * TICKS_PER_BEAT * MAX_ARRANGEMENT_MINUTES);
}

export function ticksPerBar(timeSignature: [number, number]): number {
  const [numerator, denominator] = timeSignature;
  return TICKS_PER_BEAT * numerator * (4 / denominator);
}

export function tickToBar(tick: number, timeSignature: [number, number]): number {
  return tick / ticksPerBar(timeSignature);
}

export function barBeatTick(tick: number, timeSignature: [number, number]): {
  bar: number;
  beat: number;
  subTick: number;
} {
  const tpb = ticksPerBar(timeSignature);
  const bar = Math.floor(tick / tpb) + 1;
  const beatTicks = tick % tpb;
  const beat = Math.floor(beatTicks / TICKS_PER_BEAT) + 1;
  const subTick = beatTicks % TICKS_PER_BEAT;
  return { bar, beat, subTick };
}

export function tickToX(tick: number, pixelsPerBar: number, timeSignature: [number, number], scrollX: number): number {
  return tickToBar(tick, timeSignature) * pixelsPerBar - scrollX;
}

export function xToTick(x: number, pixelsPerBar: number, timeSignature: [number, number], scrollX: number): number {
  const bar = (x + scrollX) / pixelsPerBar;
  return Math.max(0, Math.round(bar * ticksPerBar(timeSignature)));
}

export function clampPixelsPerBar(value: number, viewportWidth: number): number {
  const min = viewportWidth / 100;
  const max = viewportWidth / 1;
  return Math.min(max, Math.max(min, value));
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
