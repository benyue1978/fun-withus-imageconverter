import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleProvider from "@/components/LocaleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Image Resizer & Converter - Free Online Tool",
  description: "Free online image converter and resizer. Convert images between WebP, JPEG, PNG, AVIF, QOI formats. Resize images while maintaining aspect ratio. All processing done locally in your browser.",
  keywords: [
    "image converter",
    "image resizer", 
    "webp converter",
    "jpeg converter",
    "png converter",
    "avif converter",
    "qoi converter",
    "image format converter",
    "online image tool",
    "free image converter",
    "image compression",
    "image optimization",
    "browser image converter",
    "local image processing"
  ],
  authors: [{ name: "FunWithUs Team" }],
  creator: "FunWithUs Team",
  publisher: "FunWithUs",
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
  alternates: {
    canonical: "https://imageconverter.withus.fun",
    languages: {
      "en-US": "https://imageconverter.withus.fun",
      "zh-CN": "https://imageconverter.withus.fun",
    },
  },
  category: "Web Tools",
  classification: "Image Processing Tool",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
