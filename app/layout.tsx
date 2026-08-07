import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batam Padel Meets",
  description: "Track padel schedules, meets, and players across Batam clubs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-lime-400 text-slate-950 text-sm font-black">
                BPM
              </span>
              Batam Padel Meets
            </a>
            <span className="text-xs text-slate-400">Schedule + players tracker</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800 py-6">
          <div className="mx-auto max-w-5xl px-4 text-xs text-slate-500 flex items-center justify-between">
            <span>Data from Reclub public API</span>
            <span>Batam, Indonesia</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
