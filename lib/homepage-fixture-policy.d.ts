export const DEVELOPMENT_HOMEPAGE_FIXTURE_ENV: "OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE";

export type DevelopmentHomepageFixturePolicy = {
  active: boolean;
  developmentRuntime: boolean;
  explicitlyEnabled: boolean;
  productionDataUnavailable: boolean;
  productionRuntime: boolean;
  reason: string;
};

export function developmentHomepageFixturePolicy(input?: {
  nodeEnv?: string;
  oldSeaDogsEnv?: string;
  explicitlyEnabled?: string;
  authoritativeStoryCount?: number;
}): DevelopmentHomepageFixturePolicy;
