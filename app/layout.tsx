import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";


export const metadata = {
  title: "Escala Igreja Pro",
  description: "Gerenciamento inteligente de escalas e voluntários",
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
