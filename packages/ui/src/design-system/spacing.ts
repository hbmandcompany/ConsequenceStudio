/** ConsequenceStudio spacing and layout constants. */
export const spacing = {
  transportBarHeight: 52,
  statusBarHeight: 24,
  leftPanelWidth: 260,
  leftPanelMinWidth: 200,
  leftPanelMaxWidth: 400,
  rightPanelWidth: 320,
  rightPanelMinWidth: 240,
  rightPanelMaxWidth: 480,
  trackRowHeight: 36,
  tabBarHeight: 36,
  pianoKeyboardWidth: 52,
  velocityLaneHeight: 60,
  floppydiskPanelWidth: 380,
  commandPaletteMaxWidth: 600,
  commandPaletteMaxHeight: 400,
  scale: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
  },
} as const;

export const borderRadius = {
  xs: "3px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  none: "0px",
} as const;

export type Spacing = typeof spacing;
