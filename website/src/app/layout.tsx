import { Analytics } from "@/components/Analytics";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import React from 'react';

export const metadata: Metadata = {
  title: {
    default: "ArtfulArchivesStudio.com",
    template: "%s | ArtfulArchivesStudio.com",
  },
  description: "[Description of ArtfulArchivesStudio]",
  openGraph: {
    title: "ArtfulArchivesStudio.com",
    description:
      "[Description of ArtfulArchivesStudio]",
    url: "https://ArtfulArchivesStudio.com",
    siteName: "ArtfulArchivesStudio.com",
    images: [
      {
        url: "https://chronark.com/og.png",
        width: 1920,
        height: 1080,
      },
    ],
    locale: "en-US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: "ArtfulArchivesStudio",
    card: "summary_large_image",
  },
  icons: {
    shortcut: "/logo.ico",
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={[inter.variable, ebGaramond.variable].join(" ")}>
      <head>
        <Analytics />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}