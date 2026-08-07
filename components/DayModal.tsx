"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtIDR, fmtTimeOnly, type SlimMeet, type ClubSummary } from "@/lib/reclub";

export interface DayDetailState {
  date: Date;
  label: string;
  meets: SlimMeet[];
}

export function DayModal({
  state,
  clubs,
  onClose,
}: {
  state: DayDetailState | null;
  clubs: ClubSummary[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(state !== null);
    if (state) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);

  if (!state) return null;

  const clubName = (id: number) => clubs.find((c) => c.id === id)?.name ?? "?";
  const sorted = [...state.meets].sort((a, b) => a.start - b.start);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative w-full sm:max-w-xl max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl bg-elev border border-line shadow-2xl flex flex-col transition-transform pb-[env(safe-area-inset-bottom)] ${open ? "translate-y-0" : "translate-y-8"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-display text-2xl leading-none tracking-wide">{state.label}</h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-faint">
              {sorted.length} meets
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-9 h-9 rounded-full bg-elev2 hover:bg-line text-text-dim hover:text-text"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-2.5">
          {sorted.map((m) => {
            const row = (
              <div className="flex items-start gap-3 rounded-xl border border-line bg-bg/60 p-3.5 hover:border-ball/40 transition">
                <div className="shrink-0 w-14 text-center">
                  <p className="font-mono text-sm font-semibold text-ball">{fmtTimeOnly(m.start)}</p>
                  <p className="font-mono text-[10px] text-text-faint">
                    {m.duration >= 3600 ? `${Math.round(m.duration / 3600)}h` : `${Math.round(m.duration / 60)}m`}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-snug truncate">{m.name}</p>
                  <p className="text-xs text-text-dim mt-0.5 truncate">
                    {clubName(m.clubId)} · {m.venue ?? "Venue TBD"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono text-[11px]">
                    <span className="font-semibold text-coral">{fmtIDR(m.fee)}</span>
                    <span className="text-text-faint">
                      {m.reserved}/{m.players} joined
                    </span>
                    {m.reserved >= m.players && m.players > 0 && (
                      <span className="text-coral font-bold">FULL</span>
                    )}
                  </div>
                </div>
              </div>
            );
            return m.ref ? (
              <Link key={m.id} href={`/meet/${m.ref}`} className="block">
                {row}
              </Link>
            ) : (
              <div key={m.id} className="opacity-60">
                {row}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
