"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { fmtIDR, fmtTimeOnly, type SlimMeet, type ClubSummary } from "@/lib/reclub";
import { DayModal, type DayDetailState } from "@/components/DayModal";
import { MultiSelect, type MultiOption } from "@/components/MultiSelect";

const PALETTE = [
  "bg-lime-400",
  "bg-cyan-400",
  "bg-fuchsia-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-orange-400",
  "bg-teal-400",
  "bg-blue-400",
  "bg-pink-400",
  "bg-indigo-400",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Normalize a venue string so case/spacing variants collapse to one key. */
export function venueKey(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CalendarClient({
  clubs,
  meets,
}: {
  clubs: ClubSummary[];
  meets: SlimMeet[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Multi-select filters from URL params (?clubs=a,b&venues=x,y)
  const selClubs = useMemo(() => (searchParams.get("clubs") ?? "").split(",").filter(Boolean), [searchParams]);
  const selVenues = useMemo(() => (searchParams.get("venues") ?? "").split(",").filter(Boolean), [searchParams]);

  const setParams = (clubsNext: string[], venuesNext: string[]) => {
    const p = new URLSearchParams();
    if (clubsNext.length) p.set("clubs", clubsNext.join(","));
    if (venuesNext.length) p.set("venues", venuesNext.join(","));
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  const [selectedDay, setSelectedDay] = useState<DayDetailState | null>(null);

  const clubColor = useMemo(() => {
    const m = new Map<string, string>();
    clubs.forEach((c, i) => m.set(c.slug, PALETTE[i % PALETTE.length]));
    return m;
  }, [clubs]);

  // Location options derived from meets: venue label → normalized key
  const venueOptions = useMemo<MultiOption[]>(() => {
    const m = new Map<string, string>();
    for (const meet of meets) {
      const v = meet.venue?.trim();
      if (!v) continue;
      const key = venueKey(v);
      if (!m.has(key)) m.set(key, v);
    }
    return [...m.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [meets]);

  const clubOptions = useMemo<MultiOption[]>(
    () =>
      clubs.map((c) => ({
        value: c.slug,
        label: c.name,
        color: clubColor.get(c.slug),
      })),
    [clubs, clubColor]
  );

  // Meets matching both filter sets (empty = all)
  const filteredMeets = useMemo(() => {
    return meets.filter((m) => {
      if (selClubs.length && !selClubs.includes(m.clubSlug)) return false;
      if (selVenues.length && !(m.venue && selVenues.includes(venueKey(m.venue)))) return false;
      return true;
    });
  }, [meets, selClubs, selVenues]);

  const filteredClubIds = useMemo(() => {
    const s = new Set<number>();
    for (const m of filteredMeets) s.add(m.clubId);
    return s;
  }, [filteredMeets]);

  const filteredClubCount = filteredClubIds.size;

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const monthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const gridStart = useMemo(() => {
    const d = new Date(monthStart);
    d.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
    return d;
  }, [monthStart]);
  const gridEnd = useMemo(() => {
    const d = new Date(monthEnd);
    d.setDate(monthEnd.getDate() + (6 - ((monthEnd.getDay() + 6) % 7)));
    return d;
  }, [monthEnd]);

  const meetsByDay = useMemo(() => {
    const m = new Map<string, SlimMeet[]>();
    for (const meet of filteredMeets) {
      const d = new Date(meet.start * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = m.get(key) ?? [];
      arr.push(meet);
      m.set(key, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.start - b.start);
    return m;
  }, [filteredMeets]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() !== monthStart.getMonth()) continue;
      out.push(new Date(d));
    }
    return out;
  }, [gridStart, gridEnd, monthStart]);

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const isToday = (d: Date) => d.getTime() === today.getTime();

  const dayLabel = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const openDay = (d: Date) => {
    const key = dayKey(d);
    const dayMeets = meetsByDay.get(key) ?? [];
    if (dayMeets.length === 0) return;
    setSelectedDay({ date: d, label: dayLabel(d), meets: dayMeets });
  };

  const clubName = (id: number) => clubs.find((c) => c.id === id)?.name ?? "?";

  const hasFilter = selClubs.length > 0 || selVenues.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-6">
        <h1 className="font-display text-[clamp(40px,7vw,64px)] leading-[0.95] tracking-[0.02em]">
          {MONTHS[today.getMonth()]} <span className="text-ball">{today.getFullYear()}</span>
        </h1>
        <p className="mt-1 font-mono text-[12.5px] text-text-dim">
          {filteredMeets.length} upcoming meets
          {hasFilter ? ` across ${filteredClubCount} clubs` : ` across ${clubs.length} clubs`}
        </p>
      </section>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-elev p-4">
        <MultiSelect
          label="Clubs"
          options={clubOptions}
          selected={selClubs}
          onChange={(next) => setParams(next, selVenues)}
          placeholder="All clubs"
        />
        <MultiSelect
          label="Locations"
          options={venueOptions}
          selected={selVenues}
          onChange={(next) => setParams(selClubs, next)}
          placeholder="All locations"
        />
        {hasFilter && (
          <button
            type="button"
            onClick={() => setParams([], [])}
            className="text-xs font-bold text-text-faint hover:text-ball underline underline-offset-2"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-line overflow-hidden bg-elev/40">
        <div className="grid grid-cols-7 border-b border-line bg-elev/80">
          {DOW.map((d) => (
            <div key={d} className="py-2 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-faint">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = dayKey(d);
            const dayMeets = meetsByDay.get(key) ?? [];
            return (
              <button
                key={key}
                onClick={() => openDay(d)}
                disabled={dayMeets.length === 0}
                className={`min-h-28 border-line/60 p-1.5 border-t border-l first:border-l-0 text-left align-top transition ${
                  dayMeets.length === 0 ? "cursor-default" : "cursor-pointer hover:bg-ball/5"
                } ${isToday(d) ? "bg-ball/5" : ""}`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-xs font-bold ${
                      isToday(d)
                        ? "text-ball"
                        : d.getDay() === 0 || d.getDay() === 6
                          ? "text-text-faint"
                          : "text-text-dim"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {dayMeets.length > 0 && (
                    <span className="font-mono text-[10px] text-text-faint">{dayMeets.length}×</span>
                  )}
                </div>
                <div className="mt-1 space-y-1 max-h-24 overflow-hidden">
                  {dayMeets.slice(0, 4).map((m) => {
                    const chip = (
                      <span
                        title={`${m.name} · ${clubName(m.clubId)} · ${fmtTimeOnly(m.start)} · ${fmtIDR(m.fee)}`}
                        className={`block rounded px-1.5 py-0.5 text-[10px] leading-tight font-semibold truncate ${clubColor.get(m.clubSlug) ?? "bg-elev2 text-text-dim"}`}
                      >
                        {fmtTimeOnly(m.start)} {m.name}
                      </span>
                    );
                    return m.ref ? (
                      <Link
                        key={m.id}
                        href={`/meet/${m.ref}`}
                        className="block hover:brightness-110"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chip}
                      </Link>
                    ) : (
                      <div key={m.id} className="opacity-70">
                        {chip}
                      </div>
                    );
                  })}
                  {dayMeets.length > 4 && (
                    <div className="font-mono text-[10px] text-text-faint px-1">+{dayMeets.length - 4} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend for clubs present in the filtered view */}
      <div className="mt-4 flex flex-wrap gap-2">
        {clubs
          .filter((c) => filteredClubIds.has(c.id))
          .slice(0, 40)
          .map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-dim">
              <span className={`w-2.5 h-2.5 rounded-full ${clubColor.get(c.slug)}`} />
              {c.name}
            </span>
          ))}
      </div>

      <DayModal state={selectedDay} clubs={clubs} onClose={() => setSelectedDay(null)} />
    </div>
  );
}
