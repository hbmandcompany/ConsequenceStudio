/** ConsequenceStudio animation presets — Framer Motion compatible. */
export const animations = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
  },
  easing: {
    default: [0.4, 0, 0.2, 1] as const,
    enter: [0, 0, 0.2, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  panel: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.3 },
  },
  overlay: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2 },
  },
  diagnosticFade: {
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  analysisValue: {
    transition: { duration: 0.15 },
  },
} as const;

export type Animations = typeof animations;
