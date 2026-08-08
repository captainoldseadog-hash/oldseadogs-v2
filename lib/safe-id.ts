export function createSafeId(prefix = "id") {
  const maybeCrypto = globalThis.crypto;

  if (maybeCrypto && typeof maybeCrypto.randomUUID === "function") {
    return `${prefix}_${maybeCrypto.randomUUID().replaceAll("-", "")}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
