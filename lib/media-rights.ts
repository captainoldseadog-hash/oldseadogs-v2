export type MediaRightsInput = {
  copyrightOwnership?: string | null;
  copyrightOwner?: string | null;
  copyright?: string | null;
  photographer?: string | null;
  credit?: string | null;
  creditLine?: string | null;
  licence?: string | null;
  permissionNote?: string | null;
  permissionReceivedAt?: string | null;
  usageRestrictions?: string | null;
};

export const missingMediaRightsField = "Copyright Ownership or Rights Evidence";

export function getMediaPublicationProhibition(input: MediaRightsInput) {
  const fields = [
    input.copyrightOwnership,
    input.copyrightOwner,
    input.copyright,
    input.licence,
    input.permissionNote,
    input.usageRestrictions,
  ].map((value) => String(value || "").trim()).filter(Boolean);
  const explicitProhibition = fields.find((value) => /\bdo[\s-]+not[\s-]+publish\b/i.test(value));
  if (explicitProhibition) return "Image is marked Do Not Publish.";
  const explicitInfringement = fields.find((value) => /\b(?:copyright\s+infringement|copyright-infringing|infringing\s+copyright)\b/i.test(value));
  if (explicitInfringement) return "Image is marked as explicit copyright infringement.";
  return "";
}

function hasValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateMediaRights(input: MediaRightsInput) {
  const ownership = String(input.copyrightOwnership || "").trim().toLowerCase();
  const hasCredit = hasValue(input.credit) || hasValue(input.creditLine);
  const hasPhotographer = hasValue(input.photographer);
  const hasLicence = hasValue(input.licence);
  const hasPermission = hasValue(input.permissionNote) || hasValue(input.permissionReceivedAt);
  const hasOwner = hasValue(input.copyrightOwner);
  const hasExplicitEvidence = hasOwner || hasValue(input.copyright) || hasLicence || hasPermission ||
    hasValue(input.usageRestrictions) || (hasPhotographer && hasCredit);
  const hasOwnershipDecision = Boolean(ownership && ownership !== "unknown");
  const valid = hasOwnershipDecision || hasExplicitEvidence;
  const evidence = [
    hasOwnershipDecision ? "Copyright Ownership" : "",
    hasOwner ? "Copyright Owner" : "",
    hasValue(input.copyright) ? "Copyright Notice" : "",
    hasPhotographer && hasCredit ? "Photographer and Credit Line" : "",
    hasLicence ? "Licence" : "",
    hasPermission ? "Permission" : "",
    hasValue(input.usageRestrictions) ? "Usage Restrictions" : "",
  ].filter(Boolean);

  let missingField = "";
  if (!valid) {
    if (hasPhotographer) missingField = "Credit Line";
    else missingField = missingMediaRightsField;
  }

  return {
    valid,
    evidence,
    missingField,
  };
}
