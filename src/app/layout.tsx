import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: `${BUSINESS_NAME} | Haircuts & Smooth Fades | Coventry`,
  description: `${BUSINESS_TAGLINE}. Book online at M.Blendz, 3 Crescent Avenue, Coventry CV3 1HD.`,
  keywords: [
    "barber",
    "Coventry",
    "fade",
    "haircut",
    "M.Blendz",
    "CV3",
  ],
  openGraph: {
    title: BUSINESS_NAME,
    description: BUSINESS_TAGLINE,
    locale: "en_GB",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BUSINESS_NAME,
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
