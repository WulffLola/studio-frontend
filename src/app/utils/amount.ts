export const formatAmount = (value: unknown, fallback = "-"): string => {
  if (value === null || value === undefined || value === "") return fallback;

  const normalized = String(value).trim().replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return String(value);

  const [integerPart, decimalPart] = normalized.split(".");
  if (decimalPart === undefined || /^0+$/.test(decimalPart)) return integerPart;

  return `${integerPart},${decimalPart}`;
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Presentación monetaria en pesos ("$ 28.800", "$ 1.250.000"). Sólo para mostrar:
 * los inputs editables siguen usando `formatAmount`. Si el fallback es numérico
 * ("0") también se muestra con formato monetario.
 */
export const formatCurrency = (value: unknown, fallback = "-"): string => {
  if (value === null || value === undefined || value === "") {
    return /^-?\d+(?:[.,]\d+)?$/.test(fallback) ? formatCurrency(fallback) : fallback;
  }

  const number = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(number)) return String(value);

  return currencyFormatter.format(number);
};

export const normalizeAmountInput = (value: string): string =>
  value.replace(",", ".");

export const isValidAmountInput = (value: string): boolean =>
  /^\d*(?:[,.]\d*)?$/.test(value);
