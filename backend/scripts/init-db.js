import fs from 'node:fs/promises';
import pg from 'pg';
import { config, assertConfig } from '../src/config.js';

assertConfig();
const pool = new pg.Pool({ connectionString: config.databaseUrl });
await pool.query(await fs.readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
await pool.end();
console.log('Database schema is ready.');
