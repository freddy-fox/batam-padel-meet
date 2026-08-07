import Link from "next/link";
import { getBatamMeets, fmtIDR, type SlimMeet, type ClubSummary } from "@/lib/reclub";

export const revalidate = 300;

export const dynamic = "force-dynamic";

// Palette for club colors (cycling)
const PALETTE = [
  "bg-lime-400 text-slate-950",
  "bg-cyan-400 text-slate-950",
  "bg-fuchsia-400 text-slate-950",
  "bg-amber-400 text-slate-950",
  "bg-emerald-400 text-slate-950",
  "bg-rose-400 text-slate-950",
  "bg-violet-400 text-slate-950",
  "bg-orange-400 text-slate-950",
  "bg-teal-400 text-slate-950",
  "bg-blue-400 text-slate-950",
  "bg-pink-400 text-slate-950",
  "bg-indigo-400 text-slate-950",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const rawClub = Array.isArray(searchParams.club) ? searchParams.club[0] : (searchParams.club ?? "");
  const filter = rawClub.trim();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7)); // Monday start
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - ((monthEnd.getDay() + 6) % 7)));

  let data: { clubs: ClubSummary[]; meets: SlimMeet[] } = { clubs: [], meets: [] };
  try {
    data = await getBatamMeets();
  } catch (e) {
    console.error("Failed to load meets", e);
  }

  const clubColor = new Map<string, string>();
  data.clubs.forEach((c, i) => clubColor.set(c.slug, PALETTE[i % PALETTE.length]));

  const visibleClubs = filter
    ? data.clubs.filter((c) => c.slug === filter || c.name.toLowerCase().includes(filter.toLowerCase()))
    : data.clubs;
  const visibleIds = new Set(visibleClubs.map((c) => c.id));

  const meetsByDay = new Map<string, SlimMeet[]>();
  for (const m of data.meets) {
    if (!visibleIds.has(m.clubId)) continue;
    const d = new Date(m.start * 1000);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (meetsByDay.get(key) ?? meetsByDay.set(key, []).get(key)!).push(m);
  }

  // Only render days in this month
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    if (d.getMonth() !== monthStart.getMonth()) continue;
    days.push(new Date(d));
  }

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const isToday = (d: Date) => d.getTime() === today.getTime();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">
          {MONTHS[today.getMonth()]} {today.getFullYear()}
        </h1>
        <p className="text-slate-400 mt-1">
          {data.meets.length} upcoming meets across {data.clubs.length} clubs
        </p>
      </section>

      {/* Club filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
            !filter ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-slate-700 text-slate-400 hover:border-slate-500"
          }`}
        >
          All clubs
        </Link>
        {data.clubs.slice(0, 30).map((c) => (
          <Link
            key={c.id}
            href={filter === c.slug ? "/" : `/?club=${c.slug}`}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              filter === c.slug
                ? "border-lime-400 bg-lime-400/10 text-lime-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {c.name}
          </Link>
        ))}
        {data.clubs.length > 30 && (
          <span className="text-xs text-slate-500 self-center">+{data.clubs.length - 30} more</span>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = dayKey(d);
            const meets = meetsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-28 border-slate-800/60 p-1.5 border-t border-l first:border-l-0 ${
                  isToday(d) ? "bg-lime-400/5" : ""
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-xs font-bold ${
                      isToday(d) ? "text-lime-300" : d.getDay() === 0 || d.getDay() === 6 ? "text-slate-500" : "text-slate-300"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {meets.length > 0 && (
                    <span className="text-[10px] text-slate-500">{meets.length}×</span>
                  )}
                </div>
                <div className="mt-1 space-y-1 max-h-24 overflow-hidden">
                  {meets.slice(0, 4).map((m) => {
                    const chip = (
                      <span
                        title={`${m.name} · ${m.clubName} · ${fmtTimeOnly(m.start)} · ${fmtIDR(m.fee)}`}
                        className={`block rounded px-1.5 py-0.5 text-[10px] leading-tight font-semibold truncate ${clubColor.get(m.clubSlug) ?? "bg-slate-600"}`}
                      >
                        {fmtTimeOnly(m.start)} {m.name}
                      </span>
                    );
                    return m.ref ? (
                      <Link key={m.id} href={`/meet/${m.ref}`} className="block hover:brightness-110">
                        {chip}
                      </Link>
                    ) : (
                      <div key={m.id} className="opacity-70">
                        {chip}
                      </div>
                    );
                  })}
                  {meets.length > 4 && (
                    <div className="text-[10px] text-slate-500 px-1">+{meets.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleClubs.slice(0, 40).map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full ${clubColor.get(c.slug)}`} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function fmtTimeOnly(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
