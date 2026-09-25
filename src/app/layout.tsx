import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "SMALL FREIGHT Customer Portal", template: "%s · SMALL FREIGHT" },
  description: "Track shipments, get LTL and drayage quotes, and estimate duties.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
