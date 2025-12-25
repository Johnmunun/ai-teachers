import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CodingLive - Vivez le Code en Direct",
  description: "Plateforme d'enseignement informatique avec assistant IA en temps réel. Apprenez à coder avec une pédagogie moderne et interactive.",
  keywords: ["coding", "programmation", "cours en ligne", "IA", "enseignement", "développement web"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-[#030712] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
