/** Tick-to-bar/beat helpers for poet context (no state dependency). */

export const TICKS_PER_BEAT = 480;

export function ticksPerBar(timeSignature: [number, number]): number {
  const [numerator, denominator] = timeSignature;
  return TICKS_PER_BEAT * numerator * (4 / denominator);
}

export function barBeatFromTicks(
  tick: number,
  timeSignature: [number, number],
): { bar: number; beat: number } {
  const tpb = ticksPerBar(timeSignature);
  const bar = Math.floor(tick / tpb) + 1;
  const beatTicks = tick % tpb;
  const beat = Math.floor(beatTicks / TICKS_PER_BEAT) + 1;
  return { bar, beat };
}
