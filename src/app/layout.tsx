import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Geist_Mono, Inter, Sofia_Sans_Condensed } from "next/font/google";
import { AccentProvider } from "@/components/layout/AccentProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MotionRoot } from "@/components/layout/MotionRoot";
import "./globals.css";
import "@/styles/landing.css";
import "@/styles/works.css";

const alumni = Alumni_Sans({
  variable: "--font-alumni",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

const display = Sofia_Sans_Condensed({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://zenvyro.vercel.app"),
  title: {
    default: "Zenvyro",
    template: "%s · Zenvyro",
  },
  description: "Веб-студия. Сайты, сервисы и Telegram-продукты с характером.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Zenvyro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0a10",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${alumni.variable} ${display.variable} ${sans.variable} ${geistMono.variable} h-full`}>
      <body className={`${sans.className} flex min-h-full flex-col bg-bg-primary font-sans text-ink antialiased`}>
        <MotionRoot>
          <AccentProvider>
            <SiteChrome>{children}</SiteChrome>
          </AccentProvider>
        </MotionRoot>
      </body>
    </html>
  );
}
