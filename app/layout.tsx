import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import type { Viewport } from "next";
import { PwaRegister } from "./pwa-register";
import "./globals.css";


export const metadata = {
  title: "Escala Igreja Pro",
  description: "Gerenciamento inteligente de escalas e voluntários",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body>
          {/* Aqui você pode adicionar um Toaster futuramente para alertas */}
          <PwaRegister />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
