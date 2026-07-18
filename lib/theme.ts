/**
 * C6 — DSD tokens for TypeScript consumers (docs/dsd-curioframe.md §2–3).
 * CSS custom properties live in app/globals.css; keep the two in sync.
 * Owner: Ivy.
 */
export const theme = {
  colors: {
    bg: "#0F0E0C",
    surface: "#1A1814",
    border: "#2E2A24",
    primary: "#C9A227",
    primaryHover: "#E0B83D",
    accent: "#8B5CF6",
    text: "#F5F0E8",
    textInverse: "#0F0E0C",
    textMuted: "#9C958A",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 },
  radii: { cta: 14, secondary: 12, input: 12, slide: 16, portrait: 20, shell: 44 },
  tapTarget: { min: 56, talkButton: 72 },
  shell: { maxWidth: 390, aspect: "9 / 19.5" },
} as const;

export type Theme = typeof theme;
