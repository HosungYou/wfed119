import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

/* =============================================================================
 * Terra Editorial Design System - Typography
 * Space Grotesk: Display headlines, navigation, labels
 * IBM Plex Sans: Body text, UI elements, content
 * ============================================================================= */

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} font-body antialiased min-h-screen relative bg-surface-cream`}
        suppressHydrationWarning
      >
        {/* Terra Editorial Ambient Background */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          {/* Warm gradient mesh - Terracotta tones */}
          <div
            className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full animate-pulse-soft"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(250, 216, 202, 0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Secondary olive glow */}
          <div
            className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full animate-pulse-soft"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(196, 208, 167, 0.3) 0%, transparent 70%)',
              filter: 'blur(100px)',
              animationDelay: '2s',
            }}
          />

          {/* Subtle sand accent */}
          <div
            className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full animate-pulse-soft"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(235, 226, 208, 0.25) 0%, transparent 70%)',
              filter: 'blur(120px)',
              animationDelay: '4s',
            }}
          />

          {/* Subtle noise texture for depth */}
          <div
            className="absolute inset-0 opacity-[0.015] mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23474440'/%3E%3C/svg%3E")`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
