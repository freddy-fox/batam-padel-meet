import { getBatamMeets } from "@/lib/reclub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProbePage() {
  const t0 = Date.now();
  try {
    const data = await getBatamMeets();
    return (
      <pre>{JSON.stringify({ ok: true, ms: Date.now() - t0, clubs: data.clubs.length, meets: data.meets.length }, null, 2)}</pre>
    );
  } catch (e) {
    return (
      <pre>{JSON.stringify({ ok: false, ms: Date.now() - t0, err: (e as Error).message }, null, 2)}</pre>
    );
  }
}
