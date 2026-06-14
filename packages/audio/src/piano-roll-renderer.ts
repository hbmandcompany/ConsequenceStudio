import {
  GRID_FRAGMENT_SHADER,
  GRID_VERTEX_SHADER,
  NOTE_FRAGMENT_SHADER,
  NOTE_VERTEX_SHADER,
} from "./piano-roll-shaders.js";
import type { PianoRollNoteData } from "./piano-roll-model.js";
import {
  hexToRgb,
  pitchToY,
  tickToX,
  ticksPerBar,
  pixelsPerTick,
  TICKS_PER_BEAT,
} from "./piano-roll-math.js";

export interface PianoRollHarmonicHighlights {
  tonic_pitch_classes: number[];
  dominant_pitch_classes: number[];
  diatonic_pitch_classes: number[];
}

export interface PianoRollRenderNote extends PianoRollNoteData {
  trackColor: string;
  selected: boolean;
  harmonicConflict?: boolean;
}

export interface PianoRollViewport {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  pixelsPerBar: number;
  rowHeight: number;
  timeSignature: [number, number];
  playheadTick: number;
}

const TONIC_ROW_COLOR: [number, number, number, number] = [58 / 255, 74 / 255, 122 / 255, 0.08];
const DOMINANT_ROW_COLOR: [number, number, number, number] = [122 / 255, 106 / 255, 58 / 255, 0.05];
const CONFLICT_DOT_COLOR: [number, number, number, number] = [122 / 255, 58 / 255, 58 / 255, 0.85];
const CONFLICT_DOT_RADIUS = 3;

const QUAD = new Float32Array([
  0, 0, 1, 0, 0, 1,
  1, 0, 1, 1, 0, 1,
]);

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program) ?? "unknown"}`);
  }
  return program;
}

/** WebGL2 piano roll renderer with instanced note bubbles and grid lines. */
export class PianoRollRenderer {
  private gl: WebGL2RenderingContext;
  private noteProgram: WebGLProgram;
  private gridProgram: WebGLProgram;
  private quadVbo: WebGLBuffer;
  private instanceVbo: WebGLBuffer;
  private gridVbo: WebGLBuffer;
  private gridVertexCount = 0;
  private lastGridKey = "";

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    this.noteProgram = createProgram(gl, NOTE_VERTEX_SHADER, NOTE_FRAGMENT_SHADER);
    this.gridProgram = createProgram(gl, GRID_VERTEX_SHADER, GRID_FRAGMENT_SHADER);
    this.quadVbo = gl.createBuffer()!;
    this.instanceVbo = gl.createBuffer()!;
    this.gridVbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(
    viewport: PianoRollViewport,
    notes: PianoRollRenderNote[],
    harmonicHighlights?: PianoRollHarmonicHighlights | null,
  ): void {
    const gl = this.gl;
    const resolution: [number, number] = [this.canvas.width, this.canvas.height];
    gl.clearColor(0.03, 0.03, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (harmonicHighlights) {
      this.drawHarmonicRows(viewport, resolution, harmonicHighlights);
    }
    this.drawGrid(viewport, resolution);
    this.drawNotes(viewport, notes, resolution);
    if (harmonicHighlights) {
      this.drawHarmonicConflictDots(viewport, notes, resolution, harmonicHighlights);
    }
    this.drawPlayhead(viewport, resolution);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.noteProgram);
    gl.deleteProgram(this.gridProgram);
    gl.deleteBuffer(this.quadVbo);
    gl.deleteBuffer(this.instanceVbo);
    gl.deleteBuffer(this.gridVbo);
  }

  private drawHarmonicRows(
    viewport: PianoRollViewport,
    resolution: [number, number],
    highlights: PianoRollHarmonicHighlights,
  ): void {
    const { width, height, scrollY, rowHeight } = viewport;
    const tonic = new Set(highlights.tonic_pitch_classes);
    const dominant = new Set(highlights.dominant_pitch_classes);

    const firstPitch = Math.max(0, Math.floor(scrollY / rowHeight));
    const lastPitch = Math.min(127, firstPitch + Math.ceil(height / rowHeight) + 1);
    const rows: Array<{ y: number; color: [number, number, number, number] }> = [];

    for (let pitch = firstPitch; pitch <= lastPitch; pitch += 1) {
      const pc = pitch % 12;
      if (tonic.has(pc)) {
        rows.push({ y: pitchToY(pitch, rowHeight, scrollY), color: TONIC_ROW_COLOR });
      } else if (dominant.has(pc)) {
        rows.push({ y: pitchToY(pitch, rowHeight, scrollY), color: DOMINANT_ROW_COLOR });
      }
    }

    if (rows.length === 0) return;

    const gl = this.gl;
    gl.useProgram(this.gridProgram);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, "u_resolution"), resolution[0], resolution[1]);
    const loc = gl.getAttribLocation(this.gridProgram, "a_position");
    gl.enableVertexAttribArray(loc);

    for (const row of rows) {
      const verts = new Float32Array([
        0, row.y, width, row.y, 0, row.y + rowHeight,
        width, row.y, width, row.y + rowHeight, 0, row.y + rowHeight,
      ]);
      gl.uniform4f(gl.getUniformLocation(this.gridProgram, "u_color"), ...row.color);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  private drawHarmonicConflictDots(
    viewport: PianoRollViewport,
    notes: PianoRollRenderNote[],
    resolution: [number, number],
    highlights: PianoRollHarmonicHighlights,
  ): void {
    const ppt = pixelsPerTick(viewport.pixelsPerBar, viewport.timeSignature);
    const diatonic = new Set(highlights.diatonic_pitch_classes);
    const dots: number[] = [];

    for (const note of notes) {
      const outOfKey = note.harmonicConflict ?? !diatonic.has(note.pitch % 12);
      if (!outOfKey) continue;

      const x = tickToX(note.tick, viewport.pixelsPerBar, viewport.timeSignature, viewport.scrollX);
      const y = pitchToY(note.pitch, viewport.rowHeight, viewport.scrollY) + viewport.rowHeight * 0.5;
      const w = Math.max(3, note.duration * ppt);
      if (x + w < 0 || x > viewport.width || y < 0 || y > viewport.height) continue;

      const segments = 12;
      for (let i = 0; i < segments; i += 1) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;
        const cx = x + CONFLICT_DOT_RADIUS + 1;
        const cy = y;
        dots.push(
          cx, cy,
          cx + Math.cos(a0) * CONFLICT_DOT_RADIUS, cy + Math.sin(a0) * CONFLICT_DOT_RADIUS,
          cx + Math.cos(a1) * CONFLICT_DOT_RADIUS, cy + Math.sin(a1) * CONFLICT_DOT_RADIUS,
        );
      }
    }

    if (dots.length === 0) return;

    const gl = this.gl;
    gl.useProgram(this.gridProgram);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, "u_resolution"), resolution[0], resolution[1]);
    gl.uniform4f(gl.getUniformLocation(this.gridProgram, "u_color"), ...CONFLICT_DOT_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dots), gl.STREAM_DRAW);
    const loc = gl.getAttribLocation(this.gridProgram, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, dots.length / 2);
  }

  private drawGrid(viewport: PianoRollViewport, resolution: [number, number]): void {
    const key = `${viewport.scrollX}|${viewport.scrollY}|${viewport.pixelsPerBar}|${viewport.rowHeight}|${viewport.width}|${viewport.height}`;
    if (key !== this.lastGridKey) {
      this.rebuildGrid(viewport);
      this.lastGridKey = key;
    }

    const gl = this.gl;
    gl.useProgram(this.gridProgram);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, "u_resolution"), resolution[0], resolution[1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
    const loc = gl.getAttribLocation(this.gridProgram, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const drawLines = (color: [number, number, number, number]) => {
      gl.uniform4f(gl.getUniformLocation(this.gridProgram, "u_color"), ...color);
      gl.drawArrays(gl.LINES, 0, this.gridVertexCount);
    };

    drawLines([0.07, 0.07, 0.07, 1]);
  }

  private rebuildGrid(viewport: PianoRollViewport): void {
    const lines: number[] = [];
    const { width, height, scrollX, scrollY, rowHeight, pixelsPerBar, timeSignature } = viewport;
    const tpb = ticksPerBar(timeSignature);
    const ppt = pixelsPerTick(pixelsPerBar, timeSignature);

    const firstPitch = Math.max(0, Math.floor(scrollY / rowHeight));
    const lastPitch = Math.min(127, firstPitch + Math.ceil(height / rowHeight) + 1);
    for (let pitch = firstPitch; pitch <= lastPitch; pitch += 1) {
      const y = pitchToY(pitch, rowHeight, scrollY);
      lines.push(0, y, width, y);
    }

    const startTick = Math.max(0, Math.floor(scrollX / ppt));
    const endTick = startTick + Math.ceil(width / ppt);
    for (let tick = 0; tick <= endTick; tick += TICKS_PER_BEAT / 4) {
      if (tick < startTick) continue;
      const x = tick * ppt - scrollX;
      const isBar = tick % tpb === 0;
      const isBeat = tick % TICKS_PER_BEAT === 0;
      if (!isBar && !isBeat && tick % (TICKS_PER_BEAT / 2) !== 0) continue;
      lines.push(x, 0, x, height);
    }

    this.gridVertexCount = lines.length / 2;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
  }

  private drawNotes(
    viewport: PianoRollViewport,
    notes: PianoRollRenderNote[],
    resolution: [number, number],
  ): void {
    const ppt = pixelsPerTick(viewport.pixelsPerBar, viewport.timeSignature);
    const instances = new Float32Array(notes.length * 9);
    let visible = 0;

    for (const note of notes) {
      const x = tickToX(note.tick, viewport.pixelsPerBar, viewport.timeSignature, viewport.scrollX);
      const y = pitchToY(note.pitch, viewport.rowHeight, viewport.scrollY);
      const w = Math.max(3, note.duration * ppt);
      const h = viewport.rowHeight - 1;
      if (x + w < 0 || x > viewport.width || y + h < 0 || y > viewport.height) continue;

      const [r, g, b] = hexToRgb(note.trackColor);
      const offset = visible * 9;
      instances[offset] = x;
      instances[offset + 1] = y;
      instances[offset + 2] = w;
      instances[offset + 3] = h;
      instances[offset + 4] = r;
      instances[offset + 5] = g;
      instances[offset + 6] = b;
      instances[offset + 7] = 1;
      instances[offset + 8] = note.selected ? 1 : 0;
      visible += 1;
    }

    if (visible === 0) return;

    const gl = this.gl;
    gl.useProgram(this.noteProgram);
    gl.uniform2f(gl.getUniformLocation(this.noteProgram, "u_resolution"), resolution[0], resolution[1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    const cornerLoc = gl.getAttribLocation(this.noteProgram, "a_corner");
    gl.enableVertexAttribArray(cornerLoc);
    gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(cornerLoc, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVbo);
    gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, visible * 9), gl.DYNAMIC_DRAW);

    const stride = 9 * 4;
    const setupInstance = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(this.noteProgram, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    };
    setupInstance("a_rect", 4, 0);
    setupInstance("a_color", 4, 16);
    setupInstance("a_selected", 1, 32);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, visible);
  }

  private drawPlayhead(viewport: PianoRollViewport, resolution: [number, number]): void {
    const x = tickToX(viewport.playheadTick, viewport.pixelsPerBar, viewport.timeSignature, viewport.scrollX);
    if (x < 0 || x > viewport.width) return;
    const gl = this.gl;
    gl.useProgram(this.gridProgram);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, "u_resolution"), resolution[0], resolution[1]);
    gl.uniform4f(gl.getUniformLocation(this.gridProgram, "u_color"), 1, 1, 1, 0.9);
    const verts = new Float32Array([x, 0, x, viewport.height]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    const loc = gl.getAttribLocation(this.gridProgram, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2);
  }
}
