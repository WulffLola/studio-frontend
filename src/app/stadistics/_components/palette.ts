// Colores de series para gráficos. Derivados de la identidad Studio (violeta),
// con más saturación para que se distingan en pantalla y con daltonismo.
// Validados con el chequeo de paleta (luminosidad, croma, separación CVD y contraste ≥ 3:1).
export const SERIES = {
  /** Serie principal / valores positivos (altas, ingresos, reservas). */
  primary: "#6D5BA6",
  /** Serie de comparación neutra (convertidas, sesiones restantes). */
  secondary: "#2B8A99",
  /** Valores que restan (bajas, gastos, cancelaciones). */
  negative: "#C2652A",
  /** Línea de resultado neto. */
  anchor: "#3A3A40",
};

/** Escala secuencial de un solo tono (violeta) para el mapa de calor, de menor a mayor. */
export const HEAT_SCALE = ["#F5F3FB", "#ECE8F8", "#D9D3F5", "#B3A6E0", "#6D5BA6", "#4F407C"];
/** Índice a partir del cual el texto sobre la celda debe ser claro. */
export const HEAT_DARK_FROM = 4;

export const AXIS_TICK = { fontSize: 11, fill: "#6E6E78" };
export const GRID_STROKE = "#E3E3E8";
