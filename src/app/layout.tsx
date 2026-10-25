import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluxaX Client HUB",
  description: "FluxaX Net Client HUB • Ultra-Low Latency Broadcast & Remote VO / Video Screening",
  icons: {
    icon: "/branding/CH icon.png",
    shortcut: "/branding/CH icon.png",
    apple: "/branding/CH icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" className="scroll-smooth">
      <body className="antialiased studio-light-bg text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
