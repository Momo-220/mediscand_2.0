import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediScan - Analyse intelligente de médicaments",
  description: "Application d'analyse de médicaments par photo utilisant l'intelligence artificielle pour fournir des informations détaillées sur les médicaments.",
  icons: {
    icon: [
      { url: '/images/logo-app.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo-app.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/images/logo-app.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/images/logo-app.png'
  },
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
