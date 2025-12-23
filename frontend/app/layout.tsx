import type { Metadata } from "next";
// 1. Import Gabarito
import { Gabarito } from "next/font/google";
import "./globals.css";
import AppShell from './components/AppShell';

// 2. Konfigurasi Gabarito
const gabarito = Gabarito({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Plato Dashboard",
  description: "Dashboard Monitoring Lalu Lintas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={gabarito.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}