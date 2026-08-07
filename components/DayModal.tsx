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
        className={`relative w-full sm:max-w-xl max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col transition-transform ${open ? "translate-y-0" : "translate-y-8"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-black">{state.label}</h2>
            <p className="text-xs text-slate-400">{sorted.length} meets</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-2.5">
          {sorted.map((m) => {
            const row = (
              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-lime-400/40 transition">
                <div className="shrink-0 w-14 text-center">
                  <p className="text-sm font-black text-lime-300">{fmtTimeOnly(m.start)}</p>
                  <p className="text-[10px] text-slate-500">
                    {m.duration >= 3600 ? `${Math.round(m.duration / 3600)}h` : `${Math.round(m.duration / 60)}m`}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-snug truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {clubName(m.clubId)} · {m.venue ?? "Venue TBD"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                    <span className="text-slate-300 font-semibold">{fmtIDR(m.fee)}</span>
                    <span className="text-slate-500">
                      {m.reserved}/{m.players} joined
                    </span>
                    {m.reserved >= m.players && m.players > 0 && (
                      <span className="text-red-300 font-bold">FULL</span>
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
