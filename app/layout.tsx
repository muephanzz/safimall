import { Inter, Roboto_Mono } from "next/font/google";
import "@/styles/globals.css";
import React, { ReactNode, Suspense } from "react";
import ClientWrapper from "@/components/ClientWrapper";
import Loading from "./loading";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "safimall.co.ke",
  description: "online-shopping",
};

// Disable zooming on mobile devices
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Suspense fallback={<Loading />}>
          <AuthProvider>
            <ClientWrapper>{children}</ClientWrapper>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
