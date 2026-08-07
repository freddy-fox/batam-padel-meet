import { getBatamClubs, getClubActivities } from './lib/reclub';

const log = (m: string) => console.log(`[${Date.now() % 100000}] ${m}`);

const t0 = Date.now();
try {
  log('calling getBatamClubs...');
  const clubs = await getBatamClubs();
  log(`getBatamClubs done: ${clubs.length} clubs in ${Date.now() - t0}ms`);

  log('calling getClubActivities on first 3...');
  const r = await Promise.all(
    clubs.slice(0, 3).map((c) =>
      getClubActivities(c.id, { upcoming: true, limit: 5 })
        .then((a) => `ok:${a.length}`)
        .catch((e) => `err:${(e as Error).message}`)
    )
  );
  log(`first 3 done in ${Date.now() - t0}ms: ${r.join(', ')}`);

  log('calling getClubActivities on ALL...');
  const all = await Promise.all(
    clubs.map((c) =>
      getClubActivities(c.id, { upcoming: true, limit: 30 })
        .then((a) => `ok:${a.length}`)
        .catch((e) => `err:${(e as Error).message.slice(0, 40)}`)
    )
  );
  log(`ALL done in ${Date.now() - t0}ms`);
  const oks = all.filter((x) => x.startsWith('ok')).length;
  const errs = all.filter((x) => x.startsWith('err')).length;
  log(`ok:${oks} err:${errs}`);
} catch (e) {
  log(`FATAL: ${(e as Error).message} in ${Date.now() - t0}ms`);
}
