import {
  BOAT_TYPES,
  CRUISING_GROUNDS,
  KEEL_TYPES,
  VAT_STATUSES,
  type BoatType,
  type KeelType,
  type ListingInput,
  type VatStatus,
} from "./classifieds-types.ts";

export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateListingSubmission(input: unknown): { ok: true; value: ListingInput } | { ok: false; errors: FieldErrors } {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const errors: FieldErrors = {};
  const sellerName = cleanText(source.sellerName, 80);
  const sellerEmail = cleanText(source.sellerEmail, 200).toLowerCase();
  const sellerPhone = cleanText(source.sellerPhone, 40);
  const title = cleanText(source.title, 120);
  const make = cleanText(source.make, 80);
  const model = cleanText(source.model, 80);
  const engine = cleanText(source.engine, 120);
  const location = cleanText(source.location, 160);
  const description = cleanMultiline(source.description, 8000);
  const boatType = cleanText(source.boatType, 20) as BoatType;
  const keel = cleanText(source.keel, 20) as KeelType;
  const vatStatus = (cleanText(source.vatStatus, 30) || "unspecified") as VatStatus;
  const cruisingGround = cleanText(source.cruisingGround, 40);
  const year = optionalNumber(source.year);
  const lengthFeet = optionalNumber(source.lengthFeet);
  const berths = optionalNumber(source.berths);
  const priceGbp = optionalNumber(source.priceGbp);
  const showPhone = booleanValue(source.showPhone);
  const trailerable = booleanValue(source.trailerable);
  const liveaboard = booleanValue(source.liveaboard);
  const consent = booleanValue(source.consent);

  if (sellerName.length < 2) errors.sellerName = "Enter your name.";
  if (!EMAIL_PATTERN.test(sellerEmail)) errors.sellerEmail = "Enter a valid email address. We use it to confirm the advertisement and never show it publicly.";
  if (sellerPhone && !/^[0-9+().\-\s]{8,40}$/.test(sellerPhone)) errors.sellerPhone = "Enter a telephone number using digits, or leave it blank.";
  if (showPhone && !sellerPhone) errors.sellerPhone = "Enter a telephone number or leave “show my phone” unticked.";
  if (title.length < 3) errors.title = "Give the advertisement a title.";
  if (make.length < 2) errors.make = "Enter the boat’s make.";
  if (!BOAT_TYPES.includes(boatType)) errors.boatType = "Choose sail, power or other.";
  if (!KEEL_TYPES.includes(keel)) errors.keel = "Choose a keel type.";
  if (!VAT_STATUSES.includes(vatStatus)) errors.vatStatus = "Choose a VAT status.";
  if (!CRUISING_GROUNDS.some((ground) => ground.slug === cruisingGround)) errors.cruisingGround = "Choose a cruising ground.";
  if (location.length < 2) errors.location = "Say where the boat is lying.";
  if (description.length < 40) errors.description = "Describe the boat in at least a sentence or two.";
  if (year !== null && (!Number.isFinite(year) || year < 1900 || year > new Date().getUTCFullYear() + 1)) errors.year = "Enter a plausible year, or leave it blank.";
  if (lengthFeet !== null && (!Number.isFinite(lengthFeet) || lengthFeet < 6 || lengthFeet > 250)) errors.lengthFeet = "Enter the length in feet, between 6 and 250.";
  if (berths !== null && (!Number.isFinite(berths) || berths < 0 || berths > 40)) errors.berths = "Enter the number of berths, or leave it blank.";
  if (priceGbp !== null && (!Number.isFinite(priceGbp) || priceGbp < 0 || priceGbp > 50_000_000)) errors.priceGbp = "Enter the price in pounds, or leave it blank to say price on application.";
  if (!consent) errors.consent = "Please confirm the terms and privacy notice before sending the advertisement.";
  if (honeypotFilled(source)) errors.form = "The advertisement could not be accepted.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sellerName,
      sellerEmail,
      sellerPhone,
      showPhone,
      title,
      make,
      model,
      year,
      lengthFeet,
      boatType,
      keel,
      engine,
      berths,
      location,
      cruisingGround,
      priceGbp,
      vatStatus,
      description,
      trailerable,
      liveaboard,
      consent: true,
    },
  };
}

export function honeypotFilled(source: Record<string, unknown>) {
  return cleanText(source.companyWebsite, 200).length > 0;
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value: unknown, max: number) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

function optionalNumber(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.round(number * 10) / 10;
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes" || value === "1";
}
