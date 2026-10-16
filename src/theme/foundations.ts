import { brandFonts, brandPalette, brandScale, neutralScale } from "./brand";

export const colors = {
  brand: brandScale,
  // La escala `gray` de Chakra se reemplaza por los neutros de Studio para que
  // textos, bordes y superficies existentes hereden la nueva temperatura.
  gray: neutralScale,
  black: brandPalette.black,
  white: brandPalette.white,
};

/**
 * Tokens semánticos. Los componentes deberían consumir estos nombres en lugar
 * de colores de escala, para que la identidad pueda ajustarse desde acá.
 */
export const semanticTokens = {
  colors: {
    // Superficies
    "bg.canvas": neutralScale[50],
    "bg.surface": brandPalette.white,
    "bg.subtle": "#FAFAFB",
    "bg.muted": neutralScale[100],
    "bg.hover": "#F2F2F5",
    "bg.selected": brandScale[50],
    "bg.selectedHover": brandScale[100],
    "bg.overlay": "rgba(24, 24, 27, 0.48)",
    "bg.inverted": brandPalette.darkGray,

    // Texto
    "text.primary": brandPalette.darkGray,
    "text.secondary": neutralScale[600],
    "text.muted": neutralScale[500],
    "text.disabled": neutralScale[400],
    "text.onBrand": brandPalette.white,
    "text.brand": brandScale[700],
    "text.link": brandScale[600],

    // Bordes
    "border.subtle": neutralScale[200],
    "border.default": neutralScale[300],
    "border.strong": neutralScale[400],
    "border.focus": brandScale[500],

    // Marca
    "brand.primary": brandPalette.primary,
    "brand.secondary": brandPalette.secondary,
    "brand.accent": brandPalette.accent,

    // Estados semánticos (independientes de la marca)
    "success.fg": "green.700",
    "success.solid": "green.600",
    "success.bg": "green.50",
    "success.border": "green.200",
    "warning.fg": "orange.700",
    "warning.solid": "orange.500",
    "warning.bg": "orange.50",
    "warning.border": "orange.200",
    "error.fg": "red.700",
    "error.solid": "red.600",
    "error.bg": "red.50",
    "error.border": "red.200",
    "info.fg": "blue.700",
    "info.solid": "blue.600",
    "info.bg": "blue.50",
    "info.border": "blue.200",
    "neutral.fg": neutralScale[600],
    "neutral.bg": neutralScale[100],
    "neutral.border": neutralScale[200],
  },
  radii: {
    control: "6px",
    card: "10px",
    modal: "12px",
  },
  shadows: {
    card: "0 1px 2px rgba(58, 58, 64, 0.04)",
    dropdown: "0 6px 16px rgba(58, 58, 64, 0.10), 0 1px 3px rgba(58, 58, 64, 0.06)",
    modal: "0 16px 40px rgba(24, 24, 27, 0.16)",
    focusRing: "0 0 0 3px rgba(109, 91, 166, 0.28)",
    focusRingError: "0 0 0 3px rgba(229, 62, 62, 0.22)",
  },
};

export const fonts = {
  heading: brandFonts.heading,
  body: brandFonts.body,
};

export const shadows = {
  // Chakra usa `outline` como anillo de foco en todos sus componentes.
  outline: "0 0 0 3px rgba(109, 91, 166, 0.35)",
  xs: "0 1px 2px rgba(58, 58, 64, 0.05)",
  sm: "0 1px 3px rgba(58, 58, 64, 0.08)",
  md: "0 6px 16px rgba(58, 58, 64, 0.10)",
  lg: "0 12px 28px rgba(24, 24, 27, 0.12)",
};

/** Jerarquía tipográfica de Studio. */
export const textStyles = {
  pageTitle: { fontSize: "22px", fontWeight: 600, lineHeight: "1.3", letterSpacing: "-0.01em" },
  sectionTitle: { fontSize: "18px", fontWeight: 600, lineHeight: "1.35", letterSpacing: "-0.005em" },
  cardTitle: { fontSize: "15px", fontWeight: 600, lineHeight: "1.4" },
  body: { fontSize: "14px", fontWeight: 400, lineHeight: "1.5" },
  label: { fontSize: "13px", fontWeight: 500, lineHeight: "1.4" },
  caption: { fontSize: "12px", fontWeight: 400, lineHeight: "1.45", color: "text.muted" },
  overline: {
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: "1.4",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "text.muted",
  },
};

export const styles = {
  global: {
    "html, body": {
      bg: "bg.canvas",
      color: "text.primary",
      fontSize: "14px",
      lineHeight: "1.5",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    "*::placeholder": {
      color: "text.muted",
    },
    "*, *::before, &::after": {
      borderColor: "border.subtle",
    },
    "::selection": {
      bg: "brand.100",
    },
  },
};
