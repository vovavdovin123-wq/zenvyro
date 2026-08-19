import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Geist_Mono, Inter, Sofia_Sans_Condensed } from "next/font/google";
import { AccentProvider } from "@/components/AccentProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MotionRoot } from "@/components/MotionRoot";
import "./globals.css";
import "@/components/landing.css";
import "@/components/works.css";

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
  title: {
    default: "Zenvyro",
    template: "%s · Zenvyro",
  },
  description: "Веб-студия. Сайты, сервисы и Telegram-продукты с характером.",
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
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AccentProvider>
        </MotionRoot>
      </body>
    </html>
  );
}
