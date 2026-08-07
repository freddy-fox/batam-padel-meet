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

/** Batam community: metrics + top clubs. */
export async function getBatamClubs(): Promise<Club[]> {
  const data = await get<{
    metrics: { groupsCount: number; activitiesCount: number };
    topClubs: Club[];
  }>("/communities/453/features");
  return data.topClubs;
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
