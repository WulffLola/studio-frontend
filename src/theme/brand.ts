/**
 * Identidad de marca de Studio.
 *
 * Único lugar del proyecto donde viven los valores de marca (nombre, logos y
 * paleta oficial). El resto de la UI consume estos valores a través del theme
 * de Chakra (`src/theme`) y sus tokens semánticos.
 */

export const brandName = "Studio";

export const brandFonts = {
  body: "'Poppins', sans-serif",
  heading: "'Poppins', sans-serif",
};

/** Paleta oficial de Studio. */
export const brandPalette = {
  primary: "#6D5BA6",
  secondary: "#9285D3",
  accent: "#B8AFFF",
  white: "#FFFFFF",
  lightBackground: "#F5F5F7",
  black: "#000000",
  darkGray: "#3A3A40",
};

/**
 * Escala de marca derivada de la paleta oficial.
 * 300 = accent, 400 = secondary, 500 = primary. El resto son tonos
 * intermedios para fondos suaves (50–200) y estados hover/active (600–900).
 */
export const brandScale = {
  50: "#F5F3FB",
  100: "#ECE8F8",
  200: "#D9D3F5",
  300: brandPalette.accent,
  400: brandPalette.secondary,
  500: brandPalette.primary,
  600: "#5E4D93",
  700: "#4F407C",
  800: "#3E3263",
  900: "#2C2447",
};

/**
 * Escala neutra anclada en #F5F5F7 (50) y #3A3A40 (700). Reemplaza a la escala
 * `gray` de Chakra para que todos los grises del sistema compartan temperatura.
 * 500 mantiene contraste AA (≥4.5:1) sobre blanco y sobre #F5F5F7.
 */
export const neutralScale = {
  50: brandPalette.lightBackground,
  100: "#EDEDF0",
  200: "#E3E3E8",
  300: "#CFCFD6",
  400: "#A2A2AB",
  500: "#6E6E78",
  600: "#55555D",
  700: brandPalette.darkGray,
  800: "#2A2A2F",
  900: "#18181B",
};

/**
 * Tonos suaves para diferenciar actividades en calendarios. Familia de tintes
 * sobrios compatibles con la marca (lavanda, azul, verde agua, arena, durazno,
 * rosa…), todos legibles con texto #3A3A40.
 */
export const brandActivityPalette = [
  "#E4DFF7", // lavanda
  "#D8E6F7", // azul
  "#D3EDE8", // verde agua
  "#F3E6D3", // arena
  "#F8DDD0", // durazno
  "#F4DAE4", // rosa
  "#E1EAD3", // salvia
  "#DCDDF4", // índigo suave
  "#F1EBC9", // manteca
  "#D5E9F0", // celeste
  "#EAD9F0", // orquídea
  "#E6E6EA", // neutro
  "#CFC7EE", // lavanda media
  "#C3D8EF", // azul medio
  "#BFE0D8", // verde agua medio
  "#EBD6B8", // arena media
  "#F2C9B8", // durazno medio
  "#EBC4D3", // rosa medio
  "#D3DFC0", // salvia media
  "#C9CBEC", // índigo medio
  "#E8DDAF", // manteca media
  "#C4DFE9", // celeste medio
  "#DDC6E8", // orquídea media
  "#D6D6DD", // neutro medio
] as const;

// Actividades principales: tonos suficientemente distintos entre sí para que
// puedan reconocerse de un vistazo dentro de la misma familia cromática.
export const brandActivityColors: Record<string, string> = {
  "aero yoga": "#D8E6F7",
  "pilates circuito": "#E4DFF7",
  "yoga integral": "#D3EDE8",
  "xtreme pilates": "#F8DDD0",
  "danza afro": "#F3E6D3",
  "stretching": "#E1EAD3",
  "movimiento consciente danza": "#F4DAE4",
  "yoga para embarazadas": "#EAD9F0",
  "studio pilates": "#CFC7EE",
  "funcional": "#BFE0D8",
  "mambo intermedio coreo": "#F2C9B8",
  "mambo inicial coreo": "#F1EBC9",
  "bachata parejas": "#EBC4D3",
  "bachata shines mixto": "#C4DFE9",
};

/**
 * Paleta categórica para gráficos. Series distinguibles entre sí, con la marca
 * como primera serie y el resto en tonos complementarios de saturación media.
 */
export const brandChartPalette = {
  primary: brandPalette.primary,
  secondary: "#4F9DA6", // verde agua
  tertiary: "#D9A05B", // arena/ámbar
  quaternary: "#5B8BD9", // azul
  quinary: "#D9798A", // rosa
  negative: "#D25C5C", // series de bajas/pérdidas
  grid: neutralScale[200],
  axis: neutralScale[500],
  label: neutralScale[700],
};

/**
 * Estados de pago en la grilla de turnos. Son semánticos (no de marca):
 * `bg` es el tinte de la celda y `accent` el indicador/leyenda.
 */
export const paymentStatusColors = {
  expired: { bg: "#FBE9E8", accent: "#D25C5C" },
  unpaid: { bg: "#E6F0FA", accent: "#4A8BD0" },
  expiringSoon: { bg: "#FBF1DC", accent: "#D9A441" },
  current: { bg: "#E4F3E9", accent: "#4E9A6A" },
  waiting: { bg: neutralScale[100], accent: neutralScale[400] },
};

export const brandAssets = {
  /** Isotipo para fondos claros (contorno violeta, S en degradé). */
  logoLight: "/brand/studio-logo-light.svg",
  /** Isotipo para fondos oscuros o de marca (tile violeta, S blanca). */
  logoDark: "/brand/studio-logo-dark.svg",
  favicon: "/brand/studio-logo-dark.svg",
};

export const brand = {
  name: brandName,
  assets: brandAssets,
  palette: brandPalette,
  scale: brandScale,
  neutral: neutralScale,
  activityPalette: brandActivityPalette,
  activityColors: brandActivityColors,
  chart: brandChartPalette,
  fonts: brandFonts,
};
