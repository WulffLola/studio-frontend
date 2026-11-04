import { brandChartPalette, brandScale, neutralScale } from "../../../theme/brand";

// Colores de series para gráficos, tomados de la paleta de gráficos de la marca
// (src/theme/brand.ts) para que las estadísticas usen el mismo sistema que el resto de la app.
export const SERIES = {
  /** Serie principal / valores positivos (altas, ingresos, reservas). */
  primary: brandChartPalette.primary,
  /** Serie de comparación neutra (convertidas, sesiones restantes). */
  secondary: brandChartPalette.secondary,
  /** Valores que restan (bajas, gastos, cancelaciones). */
  negative: brandChartPalette.negative,
  /** Línea de resultado neto. */
  anchor: brandChartPalette.label,
};

/** Escala secuencial de un solo tono (marca) para el mapa de calor, de menor a mayor. */
export const HEAT_SCALE = [brandScale[50], brandScale[100], brandScale[200], brandScale[300], brandScale[500], brandScale[700]];
/** Índice a partir del cual el texto sobre la celda debe ser claro. */
export const HEAT_DARK_FROM = 4;

export const AXIS_TICK = { fontSize: 11, fill: brandChartPalette.axis };
export const GRID_STROKE = brandChartPalette.grid;
