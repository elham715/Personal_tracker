import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pool is created lazily after dotenv loads
let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected PostgreSQL pool error:', err);
    });
  }
  return pool;
};

const connectDB = async () => {
  try {
    const p = getPool();
    const client = await p.connect();
    const dbResult = await client.query('SELECT current_database()');
    const dbName = dbResult.rows[0].current_database;

    console.log(`✅ PostgreSQL Connected`);
    console.log(`📊 Database: ${dbName}`);

    // Run schema migration
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    console.log('✅ Database schema applied successfully');

    client.release();
  } catch (error) {
    console.error(`❌ Error connecting to PostgreSQL: ${error.message}`);
    console.error(`   Full error:`, error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) await pool.end();
  console.log('🛑 PostgreSQL connection pool closed through app termination');
  process.exit(0);
});

// ==========================================
// Helper: transform snake_case rows to camelCase
// ==========================================
export const toCamelCase = (row) => {
  if (!row) return null;
  const result = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
};

export const toCamelCaseArray = (rows) => {
  return rows.map(toCamelCase);
};

export { getPool as pool };
export default connectDB;
