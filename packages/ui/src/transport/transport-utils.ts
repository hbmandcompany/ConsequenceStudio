const TICKS_PER_BEAT = 480;

export function formatPlayheadPosition(
  ticks: number,
  timeSignature: [number, number],
): string {
  const beatsPerBar = timeSignature[0];
  const ticksPerBar = TICKS_PER_BEAT * beatsPerBar;
  const bar = Math.floor(ticks / ticksPerBar) + 1;
  const beat = Math.floor((ticks % ticksPerBar) / TICKS_PER_BEAT) + 1;
  const subTicks = ticks % TICKS_PER_BEAT;
  return `${bar}:${beat}:${subTicks}`;
}
