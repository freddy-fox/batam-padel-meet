"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiOption {
  /** stable key used for filtering (slug / normalized venue) */
  value: string;
  label: string;
  /** tailwind color class for the dot, optional */
  color?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  options: MultiOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const clear = () => onChange([]);

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
          open || selected.length > 0
            ? "border-lime-400/70 text-lime-300"
            : "border-slate-700 text-slate-300 hover:border-slate-500"
        }`}
      >
        <span className="text-slate-500">{label}</span>
        <span className="max-w-44 truncate text-slate-200">{summary}</span>
        <span className="text-[10px] text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-xs font-bold text-slate-400">{options.length} options</span>
            {selected.length > 0 && (
              <button type="button" onClick={clear} className="text-xs font-bold text-lime-300 hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5">
            {options.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                    on ? "bg-lime-400/10 text-lime-200" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {o.color && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${o.color}`} />}
                  <span className="flex-1 truncate">{o.label}</span>
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] font-black ${
                      on ? "border-lime-400 bg-lime-400 text-slate-950" : "border-slate-600"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
