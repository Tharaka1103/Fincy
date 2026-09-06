import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const nunitoSansHeading = Nunito_Sans({ subsets: ["latin"], variable: "--font-heading" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "FINCY – Personal Finance Tracker", template: "%s | FINCY" },
  description:
    "FINCY is a next-level personal finance tracker. Manage accounts, track expenses, set budgets, create savings goals, and get smart reminders — all in one beautifully designed app.",
  keywords: ["finance", "budget", "expense tracker", "personal finance", "savings goals"],
  authors: [{ name: "FINCY" }],
  creator: "FINCY",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "FINCY – Personal Finance Tracker",
    description: "Track finances smarter. Beautiful, secure, and built for you.",
    siteName: "FINCY",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        montserrat.variable,
        nunitoSansHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
