import type { Metadata } from "next";
import { Outfit as Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {HeroUIProvider} from "@heroui/react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IDB Connect",
  description: "Lead Management Software for Small Businesses",
  icons: {
    icon: "/favicon.PNG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <HeroUIProvider>
          {children}
          <Toaster richColors position="top-right" />
        </HeroUIProvider>
      </body>
    </html>
  );
}
