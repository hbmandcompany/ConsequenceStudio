/** ConsequenceStudio typography scale — Inter (UI) + JetBrains Mono (technical). */
export const typography = {
  fontFamily: {
    ui: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  fontSize: {
    xs: "10px",
    sm: "11px",
    compact: "12px",
    body: "13px",
    heading: "15px",
    panelTitle: "18px",
    sessionName: "24px",
    display: "32px",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  lineHeight: {
    compact: 1.4,
    body: 1.5,
    display: 1.2,
  },
} as const;

export type Typography = typeof typography;
