import { Suspense } from "react";
import { getBatamMeets, type SlimMeet, type ClubSummary } from "@/lib/reclub";
import CalendarClient from "@/components/CalendarClient";

export const revalidate = 300;

export default async function HomePage() {
  let clubs: ClubSummary[] = [];
  let meets: SlimMeet[] = [];
  try {
    const data = await getBatamMeets();
    clubs = data.clubs;
    meets = data.meets;
  } catch (e) {
    console.error("Failed to load meets", e);
  }
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8 text-slate-400">Loading calendar…</div>}>
      {clubs.length > 0 ? (
        <CalendarClient clubs={clubs} meets={meets} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="font-display text-[clamp(32px,6vw,48px)] tracking-wide">
            Couldn&apos;t load meets
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-dim">
            Reclub&apos;s API is unreachable right now. Give it a minute and refresh — or check back later.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg border border-ball/60 px-5 py-2.5 text-sm font-bold text-ball hover:bg-ball/10"
          >
            Retry
          </a>
        </div>
      )}
    </Suspense>
  );
}
