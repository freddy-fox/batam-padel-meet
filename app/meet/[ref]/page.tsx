import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeet, fmtIDR, fmtDay, fmtTimeRange, participantStatusLabel } from "@/lib/reclub";

export const revalidate = 60;

export default async function MeetPage(props: PageProps<"/meet/[ref]">) {
  const { ref } = await props.params;
  let meet;
  try {
    meet = await getMeet(ref);
  } catch {
    notFound();
  }

  const joined = (meet.participants ?? []).filter((p) => p.status === 1);
  const waitlisted = (meet.participants ?? []).filter((p) => p.status === 4);
  const requested = (meet.participants ?? []).filter((p) => p.status === 5);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-lime-300">
        ← All clubs
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{meet.name}</h1>
        <p className="mt-2 text-slate-300">{fmtDay(meet.startDatetime)}</p>
        <p className="text-slate-400">{fmtTimeRange(meet.startDatetime, meet.duration)}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <Stat label="Fee" value={fmtIDR(meet.feeAmount)} />
        <Stat label="Slots" value={`${meet.numReserved}/${meet.numPlayers}`} />
        <Stat label="Venue" value={meet.venue?.name ?? "TBD"} sub={meet.venue?.location?.address} />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">
          Players <span className="text-slate-500 font-normal">({joined.length} joined)</span>
        </h2>
        {joined.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center text-slate-400">
            No confirmed players yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {joined.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-700 text-xs font-bold shrink-0">
                  {initials(p.customName || p.display || p.username || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {p.customName || p.display || p.username || "Player"}
                    {p.isHost && <span className="ml-2 text-xs text-lime-300 font-bold">HOST</span>}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{participantStatusLabel(p.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(waitlisted.length > 0 || requested.length > 0) && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-slate-400">Waitlist & requests</h2>
          <ul className="space-y-2">
            {[...waitlisted, ...requested].map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3 opacity-70">
                <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-700 text-xs font-bold shrink-0">
                  {initials(p.customName || p.display || p.username || "?")}
                </div>
                <p className="flex-1 font-semibold truncate">{p.customName || p.display || p.username || "Player"}</p>
                <span className="text-xs text-slate-400">{participantStatusLabel(p.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {meet.notes && (
        <section>
          <h2 className="text-lg font-bold mb-3">Notes</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm whitespace-pre-line">
            {meet.notes}
          </div>
        </section>
      )}

      <p className="mt-8 text-xs text-slate-500">
        Join on Reclub:{" "}
        <a href={`https://reclub.co/m/${ref}`} className="text-lime-300 hover:underline" target="_blank" rel="noreferrer">
          https://reclub.co/m/{ref}
        </a>
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400 leading-snug">{sub}</p>}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}
