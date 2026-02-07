import pg from 'pg';

const { Pool } = pg;

// Pool is created lazily after dotenv loads
let pool;
let schemaApplied = false;

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

// Inline schema so it works in serverless (Vercel) where fs.readFileSync fails
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(255) UNIQUE,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  avatar VARCHAR(10) DEFAULT '🚀',
  bio VARCHAR(200) DEFAULT 'Building better habits, one day at a time',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '✨',
  category VARCHAR(50) DEFAULT 'Health',
  color VARCHAR(20) DEFAULT 'purple',
  target INTEGER DEFAULT 1 CHECK (target >= 1),
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  completed_dates TEXT[] DEFAULT '{}',
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_habit BOOLEAN DEFAULT FALSE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  created_date VARCHAR(10) NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_trashed ON habits(user_id, is_trashed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, created_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_habits_updated_at') THEN
    CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
`;

const connectDB = async () => {
  try {
    const p = getPool();
    const client = await p.connect();
    const dbResult = await client.query('SELECT current_database()');
    const dbName = dbResult.rows[0].current_database;

    console.log(`✅ PostgreSQL Connected`);
    console.log(`📊 Database: ${dbName}`);

    // Run schema migration (only once per process)
    if (!schemaApplied) {
      await client.query(SCHEMA_SQL);
      schemaApplied = true;
      console.log('✅ Database schema applied successfully');
    }

    client.release();
  } catch (error) {
    console.error(`❌ Error connecting to PostgreSQL: ${error.message}`);
    console.error(`   Full error:`, error);
    // Don't crash in serverless
    if (process.env.VERCEL) {
      console.error('⚠️ Serverless DB init failed, queries will connect lazily');
      return;
    }
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

// Proxy so that pool.query(...) calls getPool().query(...) lazily
const poolProxy = new Proxy({}, {
  get(_target, prop) {
    const p = getPool();
    const value = p[prop];
    return typeof value === 'function' ? value.bind(p) : value;
  }
});

export { poolProxy as pool };
export default connectDB;
