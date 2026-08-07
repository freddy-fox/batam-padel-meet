import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batam Padel Meets",
  description: "Track padel schedules, meets, and players across Batam clubs.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D1512",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-[#f2f3ee]">
        <header className="border-b border-line bg-bg/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 sm:gap-3">
              <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 sm:w-9 sm:h-9">
                <defs>
                  <clipPath id="bpm-logo-rounded">
                    <rect x="0" y="0" width="64" height="64" rx="14" ry="14" />
                  </clipPath>
                </defs>
                <g clipPath="url(#bpm-logo-rounded)">
                  <rect x="0" y="0" width="64" height="64" fill="#0D1512" />
                  <ellipse cx="32" cy="8" rx="34" ry="20" fill="#D4F14D" opacity="0.10" />
                  <circle cx="32" cy="34" r="19" fill="#D4F14D" />
                  <path d="M 15 24 Q 32 34 15 44" fill="none" stroke="#0D1512" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 49 24 Q 32 34 49 44" fill="none" stroke="#0D1512" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="32" cy="34" r="2.6" fill="#0D1512" />
                </g>
              </svg>
              <span className="font-display text-xl sm:text-2xl tracking-wide leading-none whitespace-nowrap">
                Batam Padel <span className="text-ball">Meets</span>
              </span>
            </a>
            <span className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
              Schedule + players tracker
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-6">
          <div className="mx-auto max-w-6xl px-4 font-mono text-xs text-text-faint flex items-center justify-between">
            <span>Data from Reclub public API</span>
            <span>Batam, Indonesia</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
