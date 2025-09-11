import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <header className="w-full bg-white border-b sticky top-0 z-20">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <a href="/" className="font-semibold text-gray-900">LifeCraft</a>
            <a href="/discover/strengths" className="text-gray-700 hover:text-blue-700">Strengths</a>
            <a href="/discover/enneagram" className="text-gray-700 hover:text-blue-700">Enneagram</a>
            <a href="/results" className="text-gray-700 hover:text-blue-700">Results</a>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
