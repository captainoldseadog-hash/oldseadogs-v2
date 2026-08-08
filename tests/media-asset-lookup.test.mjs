import assert from "node:assert/strict";
import test from "node:test";

import { findMediaAssetAcrossStores } from "../lib/media-asset-lookup.ts";

const localAsset = { id: "media-local", source: "local" };
const databaseAsset = { id: "media-database", source: "database" };

test("no DB binding returns an existing local media record", async () => {
  const result = await findMediaAssetAcrossStores({
    findInDatabase: null,
    findInLocalStore: async () => localAsset,
    localFallbackEnabled: false,
  });

  assert.equal(result, localAsset);
});

test("a missing DB row falls back to an existing configured local media record", async () => {
  const result = await findMediaAssetAcrossStores({
    findInDatabase: async () => null,
    findInLocalStore: async () => localAsset,
    localFallbackEnabled: true,
  });

  assert.equal(result, localAsset);
});

test("an existing DB media record remains authoritative", async () => {
  let localLookupCount = 0;
  const result = await findMediaAssetAcrossStores({
    findInDatabase: async () => databaseAsset,
    findInLocalStore: async () => {
      localLookupCount += 1;
      return localAsset;
    },
    localFallbackEnabled: true,
  });

  assert.equal(result, databaseAsset);
  assert.equal(localLookupCount, 0);
});

test("neither source containing the media record returns null", async () => {
  const result = await findMediaAssetAcrossStores({
    findInDatabase: async () => null,
    findInLocalStore: async () => null,
    localFallbackEnabled: true,
  });

  assert.equal(result, null);
});

test("a DB miss does not fall back when no local data directory is configured", async () => {
  let localLookupCount = 0;
  const result = await findMediaAssetAcrossStores({
    findInDatabase: async () => null,
    findInLocalStore: async () => {
      localLookupCount += 1;
      return localAsset;
    },
    localFallbackEnabled: false,
  });

  assert.equal(result, null);
  assert.equal(localLookupCount, 0);
});

test("database errors are preserved and never converted into local fallback", async () => {
  const databaseError = new Error("D1 lookup failed");
  let localLookupCount = 0;

  await assert.rejects(
    findMediaAssetAcrossStores({
      findInDatabase: async () => {
        throw databaseError;
      },
      findInLocalStore: async () => {
        localLookupCount += 1;
        return localAsset;
      },
      localFallbackEnabled: true,
    }),
    (error) => error === databaseError,
  );
  assert.equal(localLookupCount, 0);
});
