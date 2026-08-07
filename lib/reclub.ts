// Reclub public API client — data source for Batam Padel Meets.
// Endpoints discovered from reclub.co Nuxt bundles (see reclub-scraper skill).
const API = "https://api.reclub.co";
const BATCH = 50;

export interface Club {
  id: number;
  refCode: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  communityId: number;
  sportId: number;
  counts?: { members?: number; totalActivities?: number };
  accessToken?: string | null;
}

export interface Activity {
  id: number;
  referenceCode: string;
  type: number;
  status: number;
  startDatetime: number;
  duration: number;
  endDatetime: number;
  communityId: number;
  sportId: number;
  name: string;
  notes?: string | null;
  numPlayers: number;
  numReserved: number;
  privacy: number;
  feeType: number;
  feeAmount?: number | null;
  feeCurrency?: string | null;
  venue?: {
    venueId: number;
    name: string;
    location?: { address?: string; latitude?: number; longitude?: number } | null;
  } | null;
  participants?: Participant[];
  participantsStatusCount?: { joined?: number } | null;
}

export interface Participant {
  id: number;
  referenceType: number;
  referenceId: number;
  status: number;
  isHost?: boolean;
  isCoach?: boolean;
  userId?: number;
  username?: string;
  customName?: string | null;
  display?: string | null;
  avatarUrl?: string | null;
}

export interface MeetDetail extends Activity {
  accessToken?: string | null;
  community?: { id: number; name?: string } | null;
  hash?: string | null;
  participantsStatusCount?: { joined?: number } | null;
}

export interface PlayerProfile {
  userId: number;
  username: string;
  name?: string | null;
  imageUrl?: string | null;
  publicId?: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "x-output-casing": "camelCase", "User-Agent": "BatamPadelMeets/1.0" },
  });
  if (!res.ok) throw new Error(`Reclub ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Resolve a club slug (no @ prefix) to group id. */
export async function resolveSlug(slug: string): Promise<number> {
  const data = await get<{ slug: string; groupId: number }>(`/slugs/${slug}`);
  return data.groupId;
}

/** Club (group) details. */
export async function getClub(id: number): Promise<Club> {
  return get<Club>(`/groups/${id}`);
}

/** Activities for a club, paginated. */
export async function getClubActivities(
  id: number,
  opts: { upcoming?: boolean; past?: boolean; limit?: number } = {}
): Promise<Activity[]> {
  const { upcoming = true, past = false, limit = BATCH } = opts;
  const now = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams({
    types: "MEETS,COMPETITIONS",
    skip: "0",
    limit: String(limit),
    scopes: "MEET_PARTICIPANTS",
    sort_dir: "1",
  });
  if (upcoming && !past) params.set("min_start_datetime", String(now));
  else if (past && !upcoming) params.set("max_start_datetime", String(now));
  else params.set("min_start_datetime", "0");

  return get<Activity[]>(`/groups/${id}/activities?${params}`);
}

/** Meet/activity detail (venue, participants). */
export async function getMeet(ref: string): Promise<MeetDetail> {
  return get<MeetDetail>(`/meets/by-ref/${ref}`);
}

/** Resolve user profiles by user ids (public, no auth). */
export async function getPlayers(userIds: number[]): Promise<PlayerProfile[]> {
  if (userIds.length === 0) return [];
  const data = await get<{ players: PlayerProfile[] }>(
    `/players/userIds?userIds=${userIds.join(",")}`
  );
  return data.players ?? [];
}

/** Meet detail + resolved participant profiles. */
export async function getMeetWithPlayers(ref: string) {
  const meet = await getMeet(ref);
  const ids = [...new Set((meet.participants ?? []).map((p) => p.referenceId).filter(Boolean))];
  const players = ids.length > 0 ? await getPlayers(ids) : [];
  const map = new Map<number, PlayerProfile>();
  for (const p of players) map.set(p.userId, p);
  return { meet, playerMap: map };
}

/** Count of joined participants from the participants list (status === 1). */
export function joinedCount(a: Activity): number {
  return (a.participants ?? []).filter((p) => p.status === 1).length;
}

/** Curated extra clubs not in the community top-40 (smaller/newer clubs). */
const EXTRA_CLUB_SLUGS = ["ipadelclubid"];

/** Batam community: metrics + top clubs. */
export async function getBatamClubs(): Promise<Club[]> {
  const data = await get<{
    metrics: { groupsCount: number; activitiesCount: number };
    topClubs: Club[];
  }>("/communities/453/features");
  const clubs = [...data.topClubs];

  // Add curated extras not covered by the community top-40.
  const known = new Set(clubs.map((c) => c.slug));
  for (const slug of EXTRA_CLUB_SLUGS) {
    if (known.has(slug)) continue;
    try {
      const id = await resolveSlug(slug);
      const club = await getClub(id);
      clubs.push(club);
    } catch {
      // skip clubs that can't be resolved
    }
  }
  return clubs;
}

// --- Schedule (calendar) aggregation -------------------------------------

export interface ClubSummary {
  id: number;
  slug: string;
  name: string;
  members: number;
}

export interface SlimMeet {
  id: number;
  ref: string;
  name: string;
  start: number;
  duration: number;
  fee: number | null;
  venue: string | null;
  reserved: number;
  players: number;
  clubId: number;
  clubName: string;
  clubSlug: string;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

/** All upcoming meets across every Batam club, flattened + sorted. */
export async function getBatamMeets(limitPerClub = 30): Promise<{ clubs: ClubSummary[]; meets: SlimMeet[] }> {
  const clubs = await getBatamClubs();
  const results = await mapLimit(clubs, 8, (c) =>
    getClubActivities(c.id, { upcoming: true, limit: limitPerClub }).catch(() => [])
  );
  const meets: SlimMeet[] = [];
  results.forEach((acts, i) => {
    const club = clubs[i];
    for (const a of acts) {
      meets.push({
        id: a.id,
        ref: a.referenceCode,
        name: a.name,
        start: a.startDatetime,
        duration: a.duration,
        fee: a.feeAmount ?? null,
        venue: a.venue?.name ?? null,
        reserved: a.participantsStatusCount?.joined ?? a.numReserved,
        players: a.numPlayers,
        clubId: club.id,
        clubName: club.name,
        clubSlug: club.slug,
      });
    }
  });
  meets.sort((a, b) => a.start - b.start);
  return {
    clubs: clubs
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name, members: c.counts?.members ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    meets,
  };
}

export function fmtIDR(amount: number | null | undefined): string {
  if (amount == null) return "Free";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function fmtTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function fmtDay(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Jakarta",
  });
}

export function fmtTimeRange(ts: number, durationSec: number): string {
  const d = new Date(ts * 1000);
  const e = new Date((ts + durationSec) * 1000);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" };
  return `${d.toLocaleTimeString("en-GB", opts)} - ${e.toLocaleTimeString("en-GB", opts)} WIB`;
}

export function fmtTimeOnly(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function isUpcoming(a: Activity): boolean {
  return a.startDatetime > Math.floor(Date.now() / 1000);
}

export function isFull(a: Activity): boolean {
  return a.numReserved >= a.numPlayers && a.numPlayers > 0;
}

export function participantStatusLabel(s: number): string {
  switch (s) {
    case 1: return "Joined";
    case 4: return "Waitlisted";
    case 5: return "Requested";
    default: return "Invited";
  }
}
