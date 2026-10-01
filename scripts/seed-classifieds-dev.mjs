import { readFile } from "node:fs/promises";
import path from "node:path";
import { seedExampleBoats } from "../lib/classifieds-seed.ts";

const fixture = JSON.parse(await readFile(path.join(import.meta.dirname, "../tests/fixtures/classifieds-examples.json"), "utf8"));
const listings = await seedExampleBoats(fixture);
console.log(`Seeded ${listings.length} example boats into ${process.env.OLDSEADOGS_DATA_DIR || ".oldseadogs-data"}.`);
