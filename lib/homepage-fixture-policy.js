export const DEVELOPMENT_HOMEPAGE_FIXTURE_ENV = "OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE";

/**
 * Fail-closed policy for the optional localhost homepage fixture.
 *
 * NODE_ENV alone is never sufficient. The fixture is permitted only for an
 * explicitly enabled development runtime that is not identified as production
 * and only when the selected editor data source has no saved story records.
 */
export function developmentHomepageFixturePolicy({
  nodeEnv = "",
  oldSeaDogsEnv = "",
  explicitlyEnabled = "",
  authoritativeStoryCount = 0,
} = {}) {
  const productionRuntime = nodeEnv === "production" || oldSeaDogsEnv === "production";
  const developmentRuntime = nodeEnv === "development" && !productionRuntime;
  const requested = explicitlyEnabled === "true";
  const productionDataUnavailable = Number(authoritativeStoryCount) === 0;
  const active = developmentRuntime && requested && productionDataUnavailable;

  let reason = "fixture-disabled";
  if (productionRuntime) reason = "production-runtime-blocked";
  else if (!developmentRuntime) reason = "not-development-runtime";
  else if (!requested) reason = "explicit-opt-in-required";
  else if (!productionDataUnavailable) reason = "local-editor-data-is-authoritative";
  else if (active) reason = "development-fallback-active";

  return {
    active,
    developmentRuntime,
    explicitlyEnabled: requested,
    productionDataUnavailable,
    productionRuntime,
    reason,
  };
}
