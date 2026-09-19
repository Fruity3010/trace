// Removes the sample reports seeded on first run. Real reports are untouched.
// Usage: npm run db:clear-sample
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const file = path.join(process.env.TRACE_DATA_DIR ?? path.join(process.cwd(), 'data'), 'trace.db');
const db = new DatabaseSync(file);
const { changes } = db.prepare('DELETE FROM reports WHERE sample = 1').run();
console.log(`Removed ${changes} sample reports from ${file}`);
