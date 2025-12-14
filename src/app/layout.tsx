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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MediScan'
  },
  formatDetection: {
    telephone: false
  }
};

// Viewport doit être dans une fonction séparée pour Next.js 15+
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#2D68C4' },
      { media: '(prefers-color-scheme: dark)', color: '#1E4482' }
    ]
  };
}

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
