import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import "./slide-components.css";
import "./semantic-visuals.css";
import "./presenter.css";
import "./workspace.css";
import "./slide-quality.css";

const deckSans = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-deck-sans",
  display: "swap"
});

const deckSerif = Noto_Serif({
  weight: "variable",
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-deck-serif",
  display: "swap"
});

const deckMono = Geist_Mono({
  weight: "variable",
  subsets: ["latin", "vietnamese"],
  variable: "--font-deck-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Deckory Present",
  description: "Presentation engine có cấu trúc dành cho những câu chuyện cần được trình bày rõ ràng.",
  applicationName: "Deckory Present",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] }
};

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${deckSans.variable} ${deckSerif.variable} ${deckMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
