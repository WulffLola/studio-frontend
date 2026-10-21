"use client";

import { Badge, Box, type BadgeProps } from "@chakra-ui/react";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral" | "brand";

const toneStyles: Record<StatusTone, { bg: string; color: string; dot: string }> = {
  success: { bg: "success.bg", color: "success.fg", dot: "green.500" },
  warning: { bg: "warning.bg", color: "warning.fg", dot: "orange.400" },
  error: { bg: "error.bg", color: "error.fg", dot: "red.500" },
  info: { bg: "info.bg", color: "info.fg", dot: "blue.500" },
  neutral: { bg: "neutral.bg", color: "neutral.fg", dot: "gray.400" },
  brand: { bg: "brand.50", color: "brand.700", dot: "brand.500" },
};

/**
 * Criterio único de estados de Studio:
 * activo/aprobado/pagado → success · pendiente/vencido → warning ·
 * baja/rechazado/cancelado → error · inactivo → neutral.
 */
const statusToneMap: Array<[RegExp, StatusTone]> = [
  [/^(activ[oa]s?|aprobad[oa]s?|pagad[oa]s?|confirmad[oa]s?|vigente|completad[oa]s?|habilitad[oa]s?)$/i, "success"],
  [/^(pendiente|vencid[oa]s?|por vencer|en espera|parcial)$/i, "warning"],
  [/^(dad[oa]s? de baja|baja|rechazad[oa]s?|cancelad[oa]s?|anulad[oa]s?|eliminad[oa]s?|deshabilitad[oa]s?)$/i, "error"],
  [/^(inactiv[oa]s?|sin estado)$/i, "neutral"],
];

export const getStatusTone = (label: string): StatusTone => {
  const normalized = label.trim();
  const match = statusToneMap.find(([re]) => re.test(normalized));
  return match ? match[1] : "neutral";
};

/** Convierte "DADO DE BAJA" en "Dado de baja" sin alterar el texto original en datos. */
const toSentenceCase = (label: string) => {
  if (label !== label.toUpperCase()) return label;
  const lower = label.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

type StatusBadgeProps = Omit<BadgeProps, "children"> & {
  label: string;
  /** Fuerza un tono; si no se indica se infiere del texto. */
  tone?: StatusTone;
  showDot?: boolean;
};

const StatusBadge = ({ label, tone, showDot = true, ...rest }: StatusBadgeProps) => {
  const styles = toneStyles[tone ?? getStatusTone(label)];
  return (
    <Badge
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      bg={styles.bg}
      color={styles.color}
      whiteSpace="nowrap"
      {...rest}
    >
      {showDot && <Box as="span" w="6px" h="6px" borderRadius="full" bg={styles.dot} flexShrink={0} />}
      {toSentenceCase(label)}
    </Badge>
  );
};

export default StatusBadge;
