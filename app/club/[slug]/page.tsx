import Link from "next/link";
import { notFound } from "next/navigation";
import {
  resolveSlug,
  getClub,
  getClubActivities,
  fmtTime,
  fmtTimeRange,
  fmtIDR,
  isFull,
  type Activity,
} from "@/lib/reclub";

export const revalidate = 300;
export const dynamicParams = true;

export default async function ClubPage(props: PageProps<"/club/[slug]">) {
  const { slug } = await props.params;
  let id: number;
  try {
    id = await resolveSlug(slug);
  } catch {
    notFound();
  }
  const club = await getClub(id);
  const [upcoming, past] = await Promise.all([
    getClubActivities(id, { upcoming: true, limit: 30 }),
    getClubActivities(id, { past: true, limit: 10 }),
  ]);

  const grouped = groupByDay(upcoming);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-lime-300">
        ← All clubs
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight">{club.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {club.counts?.members?.toLocaleString() ?? "?"} members · {club.counts?.totalActivities ?? "?"} total activities
        </p>
        {club.description && (
          <p className="mt-3 text-sm text-slate-300 whitespace-pre-line line-clamp-3">{club.description}</p>
        )}
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">Upcoming meets</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center text-slate-400">
            No upcoming meets scheduled.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, acts]) => (
              <div key={day}>
                <h3 className="text-sm font-bold uppercase tracking-wide text-lime-300 mb-2">{day}</h3>
                <div className="space-y-2">
                  {acts.map((a) => (
                    <Link
                      key={a.id}
                      href={`/meet/${a.referenceCode}`}
                      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-lime-400/50 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-semibold leading-snug">{a.name}</h4>
                        <span
                          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isFull(a) ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {a.numReserved}/{a.numPlayers}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                        <span>{fmtTimeRange(a.startDatetime, a.duration)}</span>
                        <span>{fmtIDR(a.feeAmount)}</span>
                        <span>{a.venue?.name ?? "Venue TBD"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Recent past</h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 opacity-70">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold">{a.name}</h4>
                  <span className="text-xs text-slate-500">{fmtTime(a.startDatetime)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function groupByDay(acts: Activity[]): Record<string, Activity[]> {
  const map: Record<string, Activity[]> = {};
  for (const a of acts) {
    const key = new Date(a.startDatetime * 1000).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      timeZone: "Asia/Jakarta",
    });
    (map[key] ??= []).push(a);
  }
  return map;
}
