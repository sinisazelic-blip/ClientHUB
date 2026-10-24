import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluxaX Client HUB",
  description: "FluxaX Net Client HUB • Ultra-Low Latency Broadcast & Remote VO / Video Screening",
  icons: {
    icon: "/FluxaX graphics/icon-clienthub.svg",
    shortcut: "/FluxaX graphics/icon-clienthub.svg",
    apple: "/FluxaX graphics/icon-clienthub.svg",
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
