export const TICKS_PER_BEAT = 480;

export function ticksPerBar(timeSignature: [number, number]): number {
  const [numerator, denominator] = timeSignature;
  return TICKS_PER_BEAT * numerator * (4 / denominator);
}

export function pixelsPerTick(pixelsPerBar: number, timeSignature: [number, number]): number {
  return pixelsPerBar / ticksPerBar(timeSignature);
}

export function tickToX(
  tick: number,
  pixelsPerBar: number,
  timeSignature: [number, number],
  scrollX: number,
): number {
  return tick * pixelsPerTick(pixelsPerBar, timeSignature) - scrollX;
}

export function xToTick(
  x: number,
  pixelsPerBar: number,
  timeSignature: [number, number],
  scrollX: number,
): number {
  const tick = (x + scrollX) / pixelsPerTick(pixelsPerBar, timeSignature);
  return Math.max(0, Math.round(tick));
}

export function pitchToY(pitch: number, rowHeight: number, scrollY: number): number {
  return (127 - pitch) * rowHeight - scrollY;
}

export function yToPitch(y: number, rowHeight: number, scrollY: number): number {
  const pitch = 127 - Math.floor((y + scrollY) / rowHeight);
  return Math.max(0, Math.min(127, pitch));
}

export function snapTick(tick: number, quantization: string): number {
  const map: Record<string, number> = {
    "1/1": TICKS_PER_BEAT * 4,
    "1/2": TICKS_PER_BEAT * 2,
    "1/4": TICKS_PER_BEAT,
    "1/8": TICKS_PER_BEAT / 2,
    "1/16": TICKS_PER_BEAT / 4,
    "1/16T": TICKS_PER_BEAT / 6,
    "1/32": TICKS_PER_BEAT / 8,
  };
  const grid = map[quantization] ?? TICKS_PER_BEAT / 4;
  return Math.round(tick / grid) * grid;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255,
  ];
}
