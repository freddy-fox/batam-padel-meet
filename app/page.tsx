import Link from "next/link";
import { getBatamClubs, getClubActivities, fmtIDR, type Club } from "@/lib/reclub";

export const revalidate = 300; // 5 min

interface ClubWithCount extends Club {
  upcoming: number;
  upcomingFee?: number | null;
  nextActivity?: { referenceCode: string; name: string; startDatetime: number } | null;
}

export default async function HomePage() {
  let clubs: ClubWithCount[] = [];
  try {
    const top = await getBatamClubs();
    const withCounts = await Promise.all(
      top.map(async (c) => {
        try {
          const acts = await getClubActivities(c.id, { upcoming: true, limit: 5 });
          const next = acts[0];
          return {
            ...c,
            upcoming: acts.length,
            upcomingFee: next?.feeAmount ?? null,
            nextActivity: next
              ? { referenceCode: next.referenceCode, name: next.name, startDatetime: next.startDatetime }
              : null,
          } satisfies ClubWithCount;
        } catch {
          return { ...c, upcoming: 0, upcomingFee: null, nextActivity: null } satisfies ClubWithCount;
        }
      })
    );
    clubs = withCounts.sort((a, b) => b.upcoming - a.upcoming || b.counts?.members! - a.counts?.members!);
  } catch (e) {
    console.error("Failed to load clubs", e);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Batam Padel Meets</h1>
        <p className="text-slate-400 mt-1">
          Live schedules from {clubs.length} padel clubs around Batam. Pick a club to see upcoming meets and players.
        </p>
      </section>

      {clubs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 p-10 text-center text-slate-400">
          No club data available right now. Try again in a moment.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clubs.map((c) => (
            <Link
              key={c.id}
              href={`/club/${c.slug}`}
              className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-lime-400/50 hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold truncate group-hover:text-lime-300">{c.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.counts?.members?.toLocaleString() ?? "?"} members
                    {c.nextActivity ? ` · next ${formatRelative(c.nextActivity.startDatetime)}` : " · no upcoming"}
                  </p>
                </div>
                {c.upcoming > 0 && (
                  <span className="shrink-0 rounded-full bg-lime-400 text-slate-950 text-xs font-bold px-2.5 py-1">
                    {c.upcoming} upcoming
                  </span>
                )}
              </div>
              {c.nextActivity && (
                <p className="mt-2 text-sm text-slate-300 truncate">{c.nextActivity.name}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(ts: number): string {
  const now = Date.now() / 1000;
  const diff = ts - now;
  if (diff < 3600) return "in <1h";
  if (diff < 86400) return `in ${Math.round(diff / 3600)}h`;
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}
