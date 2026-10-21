"use client";

import { HStack, Image, Text, type StackProps } from "@chakra-ui/react";
import { brandAssets, brandName } from "../../../theme/brand";

type BrandLogoProps = StackProps & {
  /** Fondo sobre el que se muestra el logo: elige la variante del asset. */
  tone?: "light" | "dark";
  /** Lado del isotipo en px (el asset es cuadrado; se respeta su proporción). */
  size?: number;
  /** Muestra el nombre del producto junto al isotipo. */
  showName?: boolean;
  nameSize?: string;
};

/**
 * Logo de Studio. Usa siempre los assets reales de `public/brand`.
 * Los assets disponibles son isotipos (sin logotipo), por eso el nombre del
 * producto se muestra como texto opcional a su lado.
 */
const BrandLogo = ({
  tone = "light",
  size = 32,
  showName = false,
  nameSize = "17px",
  ...rest
}: BrandLogoProps) => (
  <HStack spacing={2.5} align="center" flexShrink={0} {...rest}>
    <Image
      src={tone === "dark" ? brandAssets.logoDark : brandAssets.logoLight}
      alt={showName ? "" : brandName}
      aria-hidden={showName ? true : undefined}
      w={`${size}px`}
      h="auto"
      objectFit="contain"
      draggable={false}
      flexShrink={0}
    />
    {showName && (
      <Text
        as="span"
        fontSize={nameSize}
        fontWeight={600}
        letterSpacing="-0.01em"
        lineHeight="1"
        color={tone === "dark" ? "white" : "text.primary"}
      >
        {brandName}
      </Text>
    )}
  </HStack>
);

export default BrandLogo;
