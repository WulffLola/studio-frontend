"use client";

import {
  Avatar,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Icon from "@mdi/react";
import {
  mdiAccountGroupOutline,
  mdiAccountMinusOutline,
  mdiBadgeAccountHorizontalOutline,
  mdiCalendarMonthOutline,
  mdiCashRegister,
  mdiChartBoxOutline,
  mdiCogOutline,
  mdiCreditCardOutline,
  mdiHomeOutline,
  mdiLightningBoltOutline,
  mdiLogout,
  mdiMenu,
  mdiNewspaperVariantOutline,
  mdiOfficeBuildingOutline,
  mdiShieldAccountOutline,
  mdiStorefrontOutline,
  mdiSwapHorizontal,
  mdiTagOutline,
  mdiUnfoldMoreHorizontal,
} from "@mdi/js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { useStudioStore } from "../stores/studio";
import BrandLogo from "./ui/BrandLogo";
import { FullPageLoader } from "./ui/Loaders";

export const SIDEBAR_WIDTH = "248px";
export const TOPBAR_HEIGHT = "60px";
// La sidebar fija se muestra desde 1024px; por debajo se usa el drawer.
const DESKTOP = "@media screen and (min-width: 1024px)";

interface LinkItemProps {
  name: string;
  path?: string;
  icon: string;
  disabled?: boolean;
}

type MaybeStudio =
  | null
  | {
    id?: number | string;
    name?: string;
    address?: string;
    is_active?: boolean;
    created_at?: string;
    [k: string]: any;
  };

const isValidStudio = (s: MaybeStudio) =>
  !!s && typeof s === "object" && typeof s.name === "string" && s.name.trim().length > 0;

const nId = (v: any) => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// Títulos de rutas que no forman parte del menú principal.
const extraPageTitles: Record<string, string> = {
  "/studioSelection": "Seleccionar estudio",
  "/settings": "Configuración",
};

const isActivePath = (pathname: string, path?: string) => {
  if (!path) return false;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
};

const AppShell = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logout, name, last_name, tipo, profile_photo } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const studioHasHydrated = useStudioStore((s: any) => s.hasHydrated as boolean);

  // Zustand
  const selectedStudio = useStudioStore((s) => (s as any).selectedStudio as MaybeStudio);
  const setSelectedStudio = useStudioStore((s) => (s as any).setSelectedStudio as (st: MaybeStudio) => void);
  const clearStudio = useStudioStore((s) => (s as any).clearStudio as () => void);

  // Redux: lista real (y opcional loading)
  const { studios, loadingStudios } = useSelector((s: any) => ({
    studios: s.studio?.studios ?? [],
    loadingStudios: s.studio?.loadingStudios ?? false, // si no lo tenés, queda false
  }));

  const pathname = usePathname();
  const router = useRouter();

  // ¿El seleccionado está en la lista real?
  const selIdNum = nId((selectedStudio as any)?.id);
  const hasStudiosLoaded = Array.isArray(studios) && studios.length > 0;

  const isInList =
    hasStudiosLoaded &&
    selIdNum !== null &&
    studios.some((it: any) => nId(it?.id) === selIdNum);

  // 🧹 Limpiar SOLO cuando la lista ya tiene datos y el seleccionado no existe ahí.
  useEffect(() => {
    if (!studioHasHydrated) return;
    if (!Array.isArray(studios)) return;
    if (loadingStudios) return;

    if (studios.length > 0 && !!selectedStudio && !isInList) {
      clearStudio();
      try {
        if (typeof window !== "undefined") localStorage.removeItem("studio-storage");
      } catch { }
    }
  }, [studios, isInList, selectedStudio, studioHasHydrated, loadingStudios, clearStudio]);

  // Etiqueta segura
  const studioLabel = useMemo(() => {
    if (!isValidStudio(selectedStudio)) return null;
    const s = selectedStudio as NonNullable<MaybeStudio>;
    return s.name ?? (typeof s.id === "number" ? `Estudio #${s.id}` : null);
  }, [selectedStudio]);

  // Mostrar SOLO si está en la lista y no estamos en /studioSelection
  const isStudioSelectionPage = pathname === "/studioSelection";
  const canShowStudio =
    studioHasHydrated &&
    !!studioLabel &&
    !isStudioSelectionPage &&
    (!hasStudiosLoaded || isInList);

  const LinkItems: Array<LinkItemProps> = useMemo(
    () => [
      { name: "Inicio", path: "/", icon: mdiHomeOutline },
      { name: "Planilla de caja", path: "/cashRegister", icon: mdiCashRegister },
      { name: "Alumnos", path: "/students", icon: mdiAccountGroupOutline },
      { name: "Pagos/Gastos", path: "/payments", icon: mdiCreditCardOutline },
      { name: "Turnos", path: "/appointments", icon: mdiCalendarMonthOutline },
      ...(tipo !== "Consultor" ? [{ name: "Profesoras", path: "/teachers", icon: mdiBadgeAccountHorizontalOutline }] : []),
      ...(tipo !== "Consultor" ? [{ name: "Precios/Planes", path: "/plans", icon: mdiTagOutline }] : []),
      ...(tipo !== "Consultor" ? [{ name: "Horarios/Estudios", path: "/studios", icon: mdiOfficeBuildingOutline }] : []),
      { name: "Historial de Bajas", path: "/lowsHistory", icon: mdiAccountMinusOutline },
      ...(tipo !== "Consultor" ? [{ name: "Acciones", path: "/actions", icon: mdiLightningBoltOutline }] : []),
      ...(tipo !== "Consultor" ? [{ name: "Estadísticas", path: "/stadistics", icon: mdiChartBoxOutline }] : []),
      ...(tipo !== "Consultor" ? [{ name: "Usuarios", path: "/users", icon: mdiShieldAccountOutline }] : []),
      ...(tipo !== "Consultor" ? [{ name: "Contenido para alumnos", path: "/feed", icon: mdiNewspaperVariantOutline }] : []),
      // Integración de WhatsApp pausada temporalmente.
      // ...(tipo?.toLowerCase() === "super"
      // ? [{ name: "Configuración", path: "/settings", icon: mdiCogOutline }]
      // : []),
    ],
    [tipo]
  );

  const pageTitle = useMemo(() => {
    const item = LinkItems.find((link) => isActivePath(pathname, link.path));
    return item?.name ?? extraPageTitles[pathname] ?? "";
  }, [LinkItems, pathname]);

  const handleLogout = () => {
    setIsLoggingOut(true);

    try {
      clearStudio?.();
      setSelectedStudio?.(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("studio-storage");
      }
    } catch { }

    logout();
    router.replace("/login");
  };

  const handleLinkClick = (path: string) => {
    if (!path || path === pathname) {
      onClose();
      return;
    }

    setIsNavigating(true);
    onClose();
    router.push(path);
  };

  useEffect(() => {
    setIsNavigating(false);
    setIsLoggingOut(false);
  }, [pathname]);

  const onNavClick = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    // Respeta ctrl/cmd/shift + click (abrir en otra pestaña).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    handleLinkClick(path);
  };

  const fullName = name && last_name ? `${name} ${last_name}` : "";
  const showNavigation = !isStudioSelectionPage;

  const userMenu = (placement: "top" | "bottom-end", compact = false) => (
    <Menu placement={placement} gutter={6}>
      <MenuButton
        w={compact ? "auto" : "100%"}
        p={compact ? 1 : 2}
        borderRadius="8px"
        textAlign="left"
        transition="background-color 120ms ease"
        _hover={{ bg: "bg.hover" }}
        _active={{ bg: "bg.muted" }}
        _focusVisible={{ boxShadow: "focusRing", outline: "none" }}
        aria-label="Menú de usuario"
      >
        <HStack spacing={2.5} minW={0}>
          <Avatar
            key={profile_photo ?? "no-photo"}
            size="sm"
            name={fullName}
            src={profile_photo ?? undefined}
          />
          {!compact && (
            <>
              <Box flex="1" minW={0}>
                {fullName && (
                  <Text fontSize="13px" fontWeight={600} color="text.primary" noOfLines={1}>
                    {fullName}
                  </Text>
                )}
                {canShowStudio ? (
                  <Text fontSize="12px" color="text.muted" noOfLines={1}>
                    {studioLabel}
                  </Text>
                ) : (
                  tipo && (
                    <Text fontSize="12px" color="text.muted" noOfLines={1}>
                      {tipo}
                    </Text>
                  )
                )}
              </Box>
              <Box color="text.muted" flexShrink={0}>
                <Icon path={mdiUnfoldMoreHorizontal} size={0.75} />
              </Box>
            </>
          )}
        </HStack>
      </MenuButton>
      <MenuList zIndex={1500}>
        {!isStudioSelectionPage && (
          <>
            <MenuItem
              icon={<Icon path={mdiSwapHorizontal} size={0.75} />}
              onClick={() => handleLinkClick("/studioSelection")}
            >
              Cambiar de estudio
            </MenuItem>
            <MenuDivider />
          </>
        )}
        <MenuItem
          icon={<Icon path={mdiLogout} size={0.75} />}
          onClick={handleLogout}
          _hover={{ bg: "error.bg", color: "error.fg" }}
          _focus={{ bg: "error.bg", color: "error.fg" }}
        >
          Cerrar sesión
        </MenuItem>
      </MenuList>
    </Menu>
  );

  const navigation = (
    <Flex direction="column" h="100%" minH={0}>
      <Flex align="center" h={TOPBAR_HEIGHT} px={5} flexShrink={0}>
        <Link href="/" aria-label="Ir al inicio" onClick={(e) => onNavClick(e, "/")}>
          <BrandLogo tone="light" size={30} showName />
        </Link>
      </Flex>

      <Box as="nav" aria-label="Navegación principal" flex="1" overflowY="auto" px={3} py={2}>
        <Stack as="ul" listStyleType="none" spacing={0.5}>
          {LinkItems.map((link) => {
            const active = isActivePath(pathname, link.path);
            return (
              <Box as="li" key={link.name}>
                <Box
                  as={Link}
                  href={link.path ?? "#"}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => onNavClick(e, link.path ?? "#")}
                  aria-current={active ? "page" : undefined}
                  position="relative"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  h="38px"
                  px={3}
                  borderRadius="control"
                  fontSize="14px"
                  fontWeight={500}
                  color={active ? "text.brand" : "text.secondary"}
                  bg={active ? "bg.selected" : "transparent"}
                  transition="background-color 120ms ease, color 120ms ease"
                  _hover={{
                    bg: active ? "bg.selected" : "bg.hover",
                    color: active ? "text.brand" : "text.primary",
                  }}
                  _focusVisible={{ boxShadow: "focusRing", outline: "none" }}
                  _before={
                    active
                      ? {
                        content: '""',
                        position: "absolute",
                        left: "-12px",
                        top: "9px",
                        bottom: "9px",
                        w: "3px",
                        borderRightRadius: "full",
                        bg: "brand.500",
                      }
                      : undefined
                  }
                >
                  <Box as="span" color={active ? "brand.500" : "text.muted"} flexShrink={0} display="flex">
                    <Icon path={link.icon} size={0.8} />
                  </Box>
                  <Text as="span" noOfLines={1}>
                    {link.name}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box px={3} py={3} borderTop="1px solid" borderColor="border.subtle" flexShrink={0}>
        {userMenu("top")}
      </Box>
    </Flex>
  );

  return (
    <>
      {isLoggingOut && <FullPageLoader position="fixed" inset={0} minH="100vh" bg="bg.canvas" zIndex={1600} />}

      {/* Sidebar fija (desktop) */}
      {showNavigation && (
        <Box
          as="aside"
          display="none"
          sx={{ [DESKTOP]: { display: "block" } }}
          position="fixed"
          top={0}
          bottom={0}
          left={0}
          w={SIDEBAR_WIDTH}
          bg="bg.surface"
          borderRight="1px solid"
          borderColor="border.subtle"
          zIndex={20}
        >
          {navigation}
        </Box>
      )}

      {/* Drawer (tablet / mobile) */}
      {showNavigation && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent maxW="280px">
            <DrawerCloseButton top={3.5} right={3} zIndex={2} />
            <DrawerBody p={0}>{navigation}</DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      <Box minH="100vh" sx={showNavigation ? { [DESKTOP]: { marginLeft: SIDEBAR_WIDTH } } : undefined}>
        {/* Topbar */}
        <Flex
          as="header"
          position="sticky"
          top={0}
          zIndex={15}
          h={TOPBAR_HEIGHT}
          align="center"
          gap={3}
          px={{ base: 3, md: 6, xl: 8 }}
          bg="bg.surface"
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          {showNavigation && (
            <IconButton
              sx={{ [DESKTOP]: { display: "none" } }}
              icon={<Icon path={mdiMenu} size={0.95} />}
              aria-label="Abrir menú"
              onClick={onOpen}
              variant="ghost"
              ml={-1}
            />
          )}

          {!showNavigation ? (
            <BrandLogo tone="light" size={28} showName />
          ) : (
            <Box flexShrink={0} sx={{ [DESKTOP]: { display: "none" } }}>
              <BrandLogo tone="light" size={26} />
            </Box>
          )}

          {showNavigation && pageTitle && (
            <Text
              as="h1"
              fontSize={{ base: "16px", md: "18px" }}
              fontWeight={600}
              letterSpacing="-0.01em"
              color="text.primary"
              noOfLines={1}
              minW={0}
            >
              {pageTitle}
            </Text>
          )}

          <HStack ml="auto" spacing={3} flexShrink={0}>
            {canShowStudio && (
              <HStack
                display={{ base: "none", md: "flex" }}
                spacing={1.5}
                px={2.5}
                h="30px"
                borderRadius="full"
                bg="bg.muted"
                color="text.secondary"
                maxW="260px"
                title="Estudio activo"
              >
                <Icon path={mdiStorefrontOutline} size={0.65} />
                <Text fontSize="13px" fontWeight={500} noOfLines={1}>
                  {studioLabel}
                </Text>
              </HStack>
            )}
            {!showNavigation && userMenu("bottom-end", true)}
          </HStack>
        </Flex>

        <Box as="main" position="relative">
          {children}
        </Box>
      </Box>

      {isNavigating && (
        <FullPageLoader
          position="fixed"
          top={TOPBAR_HEIGHT}
          left={0}
          sx={showNavigation ? { [DESKTOP]: { left: SIDEBAR_WIDTH } } : undefined}
          right={0}
          bottom={0}
          minH="auto"
          bg="bg.canvas"
          zIndex={14}
          aria-label="Cargando página"
        />
      )}
    </>
  );
};

export default AppShell;
