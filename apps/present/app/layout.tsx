import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Deckory Present", description: "A structured browser presentation by Deckory", manifest: "/manifest.webmanifest" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
