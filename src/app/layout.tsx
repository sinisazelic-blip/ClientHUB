import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluxaX",
  description: "FluxaX Net Client HUB",
  icons: {
    icon: "/branding/fluxax-net-brand.svg",
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
