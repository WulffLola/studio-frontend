"use client";

import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Providers } from "./providers";
import AuthGate from "./components/AuthGate";
import { brandAssets, brandName, brandPalette } from "../theme/brand";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/svg+xml" href={brandAssets.favicon} />
        <meta name="theme-color" content={brandPalette.primary} />
        <title>{brandName}</title>
      </head>
      <body>
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}
