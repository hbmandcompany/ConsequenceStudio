/** ConsequenceStudio color palette — dark-first monochromatic with semantic accents. */
export const colors = {
  background: {
    canvas: "#080808",
    surface: "#111111",
    elevated: "#1A1A1A",
    modal: "#222222",
  },
  border: {
    hairline: "#1F1F1F",
    standard: "#2C2C2C",
    active: "#3A3A3A",
  },
  text: {
    primary: "#F2F2F2",
    secondary: "#8A8A8A",
    muted: "#4A4A4A",
    accent: "#FFFFFF",
  },
  accent: {
    platform: "#FFFFFF",
    stable: "#4A7A4A",
    tension: "#7A6A3A",
    error: "#7A3A3A",
    cmte: "#3A4A7A",
    doctor: "#5A3A7A",
  },
  track: {
    blue: "#3A5A7A",
    teal: "#3A6A6A",
    green: "#4A7A4A",
    lime: "#5A7A3A",
    amber: "#7A6A3A",
    orange: "#7A5A3A",
    rose: "#7A3A3A",
    red: "#7A3A4A",
    violet: "#5A3A7A",
    indigo: "#3A4A7A",
    cyan: "#3A6A7A",
    fuchsia: "#6A3A7A",
  },
  pianoRoll: {
    naturalRow: "#111111",
    sharpRow: "#0D0D0D",
    gridBar: "#2C2C2C",
    gridBeat: "#1A1A1A",
    gridSubdivision: "#151515",
  },
  shadow: {
    subtle: "0 1px 3px rgba(0,0,0,0.6)",
    floating: "0 4px 12px rgba(0,0,0,0.7)",
    modal: "0 8px 24px rgba(0,0,0,0.8)",
  },
} as const;

export type Colors = typeof colors;
