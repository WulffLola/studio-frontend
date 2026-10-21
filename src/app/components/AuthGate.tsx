"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth";
import AppShell from "./AppShell";
import { FullPageLoader } from "./ui/Loaders";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

const isPublicPath = (pathname: string) =>
  publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

const consultantAllowedRoutes = [
  "/",
  "/cashRegister",
  "/students",
  "/payments",
  "/appointments",
  "/lowsHistory",
  "/studioSelection",
];

const normalizePathname = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = normalizePathname(usePathname());
  const { hasHydrated, isAuthenticated, tipo } = useAuthStore();

  const isPublicRoute = isPublicPath(pathname);
  const isConsultant = tipo?.toLowerCase() === "consultor";
  const isSuper = tipo?.toLowerCase() === "super";
  const isConsultantAllowedRoute = consultantAllowedRoutes.includes(pathname);
  const isSettingsRoute = pathname === "/settings" || pathname.startsWith("/settings/");
  const isUnauthorizedRoute =
    hasHydrated &&
    isAuthenticated &&
    ((isConsultant && !isPublicRoute && !isConsultantAllowedRoute) ||
      (isSettingsRoute && !isSuper));

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (isUnauthorizedRoute) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, isPublicRoute, isUnauthorizedRoute, router]);

  if (!hasHydrated) {
    return <FullPageLoader minH="100vh" bg="bg.canvas" />;
  }

  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  if (isUnauthorizedRoute) {
    return null;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
