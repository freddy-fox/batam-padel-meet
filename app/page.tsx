import { Suspense } from "react";
import { getBatamMeets, type SlimMeet, type ClubSummary } from "@/lib/reclub";
import CalendarClient from "@/components/CalendarClient";

export const revalidate = 300;
export const dynamic = "force-dynamic";

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
      <CalendarClient clubs={clubs} meets={meets} />
    </Suspense>
  );
}
