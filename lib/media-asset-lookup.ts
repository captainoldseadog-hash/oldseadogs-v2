export type MediaAssetLookupOptions<T> = {
  findInDatabase?: (() => Promise<T | null>) | null;
  findInLocalStore: () => Promise<T | null>;
  localFallbackEnabled: boolean;
};

/**
 * Resolve one media record without coupling storage-selection policy to either
 * Drizzle or the local JSON-store implementation.
 *
 * Database errors intentionally propagate. Only a successful database lookup
 * that returns no row may fall back to local storage, and only when the caller
 * confirms that an explicit local data directory is configured.
 */
export async function findMediaAssetAcrossStores<T>({
  findInDatabase,
  findInLocalStore,
  localFallbackEnabled,
}: MediaAssetLookupOptions<T>): Promise<T | null> {
  if (!findInDatabase) return findInLocalStore();

  const databaseAsset = await findInDatabase();
  if (databaseAsset) return databaseAsset;
  if (!localFallbackEnabled) return null;

  return findInLocalStore();
}
