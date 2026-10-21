import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio TAF • Četiri Decenije Zvuka, Muzičke Produkcije & Akustike",
  description: "Zvanični audio centar i distributivni hab Studija TAF: autorska muzička produkcija, 10 hardverskih sintisajzera, Moj Radio in-store audio infrastruktura, remote režija i klijentski vault.",
  icons: {
    icon: "/logos/taf-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" className="scroll-smooth">
      <body className="antialiased bg-[#0b0f19] text-slate-100 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
