import type { Metadata } from "next";
import { Outfit, Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeCraft - Strength Discovery",
  description: "Discover your unique strengths through storytelling. An AI-powered career development tool based on Hope-Action Theory and Human Agency Theory.",
  keywords: ["career development", "strength discovery", "storytelling", "AI coaching", "lifecraft"],
  authors: [{ name: "LifeCraft Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen relative`}
        suppressHydrationWarning
      >
        {/* Ambient Background Mesh */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[100px] animate-pulse-soft" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px] animate-pulse-soft delay-1000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-teal-200/30 blur-[100px] animate-pulse-soft delay-2000" />
        </div>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
