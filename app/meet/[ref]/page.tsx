import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMeetWithPlayers,
  fmtIDR,
  fmtDay,
  fmtTimeRange,
  joinedCount,
  participantStatusLabel,
  type Participant,
} from "@/lib/reclub";

export const revalidate = 60;

export default async function MeetPage(props: PageProps<"/meet/[ref]">) {
  const { ref } = await props.params;
  let meet;
  let playerMap;
  try {
    const data = await getMeetWithPlayers(ref);
    meet = data.meet;
    playerMap = data.playerMap;
  } catch {
    notFound();
  }

  const parts = meet.participants ?? [];
  const joined = parts.filter((p) => p.status === 1);
  const waitlisted = parts.filter((p) => p.status === 4);
  const requested = parts.filter((p) => p.status === 5);
  const joinedTotal = joinedCount(meet);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-text-faint hover:text-ball">
        ← All clubs
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[0.95] tracking-[0.02em]">
          {meet.name}
        </h1>
        <p className="mt-3 text-text-dim">{fmtDay(meet.startDatetime)}</p>
        <p className="font-mono text-[12.5px] text-text-faint">{fmtTimeRange(meet.startDatetime, meet.duration)}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <Stat label="Fee" value={fmtIDR(meet.feeAmount)} />
        <Stat label="Slots" value={`${joinedTotal}/${meet.numPlayers}`} />
        <Stat label="Venue" value={meet.venue?.name ?? "TBD"} sub={meet.venue?.location?.address} />
      </div>

      <section className="mb-8">
        <h2 className="font-display text-2xl tracking-wide mb-3">
          Players <span className="font-mono text-sm text-text-faint normal-case">({joinedTotal} joined)</span>
        </h2>
        {joined.length === 0 ? (
          <div className="rounded-xl border border-line p-8 text-center text-text-dim">
            No confirmed players yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {joined.map((p) => {
              const profile = p.referenceId ? playerMap.get(p.referenceId) : undefined;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-elev p-3">
                  <Avatar p={p} profileName={profile?.name} imageUrl={profile?.imageUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {profile?.name || p.customName || p.display || p.username || profile?.username || "Player"}
                      {p.isHost && <span className="ml-2 text-xs text-ball font-bold">HOST</span>}
                      {p.isCoach && <span className="ml-2 text-xs text-cyan-300 font-bold">COACH</span>}
                    </p>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-faint">
                    {participantStatusLabel(p.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(waitlisted.length > 0 || requested.length > 0) && (
        <section className="mb-8">
          <h2 className="font-display text-2xl tracking-wide mb-3 text-text-dim">Waitlist & requests</h2>
          <ul className="space-y-2">
            {[...waitlisted, ...requested].map((p) => {
              const profile = p.referenceId ? playerMap.get(p.referenceId) : undefined;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-elev/60 p-3 opacity-70">
                  <Avatar p={p} profileName={profile?.name} imageUrl={profile?.imageUrl} />
                  <p className="flex-1 font-semibold truncate">
                    {profile?.name || p.customName || p.display || p.username || profile?.username || "Player"}
                  </p>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-faint">
                    {participantStatusLabel(p.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {meet.notes && (
        <section>
          <h2 className="font-display text-2xl tracking-wide mb-3">Notes</h2>
          <div className="rounded-xl border border-line bg-elev p-4 text-sm whitespace-pre-line">
            {meet.notes}
          </div>
        </section>
      )}

      <p className="mt-8 font-mono text-[11px] text-text-faint">
        Join on Reclub:{" "}
        <a href={`https://reclub.co/m/${ref}`} className="text-ball hover:underline" target="_blank" rel="noreferrer">
          https://reclub.co/m/{ref}
        </a>
      </p>
    </div>
  );
}

function Avatar({ p, profileName, imageUrl }: { p: Participant; profileName?: string | null; imageUrl?: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="grid place-items-center w-9 h-9 rounded-full bg-elev2 text-xs font-bold shrink-0">
      {initials(profileName || p.customName || p.display || p.username || "?")}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-elev p-4">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-faint font-semibold">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-text-dim leading-snug">{sub}</p>}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}
