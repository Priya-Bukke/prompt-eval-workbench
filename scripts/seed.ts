import { createDb } from "../src/lib/db";
import { repo } from "../src/lib/repo";
import { seedExample } from "../src/lib/seed";

const db = await createDb({ dataDir: process.env.PGLITE_DIR ?? "./.pglite" });
const id = await seedExample(repo(db));
console.log(`Example prompt ready (id ${id}). Start the app with: npm run dev`);
process.exit(0);
