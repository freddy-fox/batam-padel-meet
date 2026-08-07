import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batam Padel Meets",
  description: "Track padel schedules, meets, and players across Batam clubs.",
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
            <a href="/" className="flex items-center gap-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-ball text-bg text-sm font-black">
                BPM
              </span>
              <span className="font-display text-2xl tracking-wide leading-none">
                Batam Padel <span className="text-ball">Meets</span>
              </span>
            </a>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
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
