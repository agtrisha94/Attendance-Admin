// services/user.service.ts
import api from "@/lib/api";

export interface UserLite {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Simple in-memory cache for the session */
const userCache = new Map<string, UserLite>();

/** Helper: run promises with concurrency limit */
async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = (async () => {
      const res = await mapper(item);
      results.push(res);
    })();

    // ensure the promise stored in `executing` resolves to void
    const tracked = p
      .then(() => {
        executing.delete(tracked as Promise<void>);
      })
      .catch(() => {
        executing.delete(tracked as Promise<void>);
      });

    executing.add(tracked as Promise<void>);

    if (executing.size >= concurrency) {
      // wait for the first to finish
      await Promise.race(executing);
    }
  }

  // wait for remaining
  await Promise.allSettled(Array.from(executing));
  return results;
}

/**
 * Fetch users by their ids using GET /users/:id per id.
 * Uses a short-lived in-memory cache to reduce requests.
 */
export const fetchUsersByIds = async (ids: string[]): Promise<UserLite[]> => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (uniqueIds.length === 0) return [];

  // split into ids we already have in cache vs ones to fetch
  const toFetch: string[] = [];
  const cached: UserLite[] = [];

  for (const id of uniqueIds) {
    if (userCache.has(id)) cached.push(userCache.get(id)!);
    else toFetch.push(id);
  }

  if (toFetch.length === 0) return cached;

  // fetch with concurrency limit
  const fetched = await mapWithConcurrency<string, UserLite | null>(
    toFetch,
    async (id) => {
      try {
        const resp = await api.get<UserLite>(`/users/${encodeURIComponent(id)}`);
        const user = resp.data;
        if (user) userCache.set(id, user);
        return user;
      } catch (err) {
        console.warn(`fetch user ${id} failed`, err);
        return null;
      }
    },
    5 // concurrency
  );

  const successful = fetched.filter(Boolean) as UserLite[];

  return [...cached, ...successful];
};

/** Optional: helper to clear cache (useful for testing) */
export const clearUserCache = () => userCache.clear();
