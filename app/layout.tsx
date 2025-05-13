import { Inter, Roboto_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "SmartKenya | Kenya's Leading Online Shopping Platform",
  description: "Shop electronics, fashion, home goods & more on SmartKenya. Best prices in Kenya, fast delivery & secure payments.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RootLayoutProps {
  children: ReactNode;
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SmartKenya",
  "url": "https://www.smartkenya.co.ke",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.smartkenya.co.ke/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Suspense fallback={<Loading />}>
          <AuthProvider>
            <ClientWrapper>{children}</ClientWrapper>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
