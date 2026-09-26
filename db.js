/* ===== Base de donnees ===== */
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function normalizeParams(params) {
  if (Array.isArray(params)) return params;
  if (params && typeof params === 'object') return Object.keys(params).map((key) => params[key]);
  return [];
}

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cat TEXT,
        brand TEXT,
        price INTEGER NOT NULL,
        old INTEGER DEFAULT 0,
        gen TEXT DEFAULT '-',
        cpu TEXT DEFAULT '-',
        ram INTEGER DEFAULT 0,
        ssd INTEGER DEFAULT 0,
        tactile BOOLEAN DEFAULT FALSE,
        dispo BOOLEAN DEFAULT TRUE,
        promo BOOLEAN DEFAULT FALSE,
        neuf BOOLEAN DEFAULT FALSE,
        rating INTEGER DEFAULT 5,
        sold INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 10,
        low_stock INTEGER DEFAULT 3,
        img TEXT,
        gallery JSONB,
        descr TEXT,
        specs JSONB
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        created TIMESTAMPTZ,
        client TEXT,
        phone TEXT,
        email TEXT,
        zone TEXT,
        addr TEXT,
        note TEXT,
        pay TEXT,
        ship_cost INTEGER DEFAULT 0,
        total INTEGER,
        status TEXT DEFAULT 'Nouvelle',
        items JSONB
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        pass_hash TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_moves (
        id SERIAL PRIMARY KEY,
        product_id INTEGER,
        created TIMESTAMPTZ,
        delta INTEGER,
        reason TEXT,
        stock_after INTEGER
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_codes (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);
  }

  ensureSchema().catch((err) => {
    console.error('Erreur init PostgreSQL :', err);
  });

  module.exports = {
    async query(text, params = []) {
      const values = normalizeParams(params);
      return pool.query(text, values);
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          query: async (sql, values = []) => client.query(sql, normalizeParams(values))
        });
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    }
  };
} else {
  const Database = require('better-sqlite3');
  const sqlite = new Database(path.join(DATA_DIR, 'kambire.db'));
  sqlite.pragma('journal_mode = WAL');

  sqlite.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cat TEXT,
    brand TEXT,
    price INTEGER NOT NULL,
    old INTEGER DEFAULT 0,
    gen TEXT DEFAULT '-',
    cpu TEXT DEFAULT '-',
    ram INTEGER DEFAULT 0,
    ssd INTEGER DEFAULT 0,
    tactile INTEGER DEFAULT 0,
    dispo INTEGER DEFAULT 1,
    promo INTEGER DEFAULT 0,
    neuf INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 5,
    sold INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 10,
    low_stock INTEGER DEFAULT 3,
    img TEXT,
    gallery TEXT,
    descr TEXT,
    specs TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT UNIQUE,
    created TEXT,
    client TEXT,
    phone TEXT,
    email TEXT,
    zone TEXT,
    addr TEXT,
    note TEXT,
    pay TEXT,
    ship_cost INTEGER DEFAULT 0,
    total INTEGER,
    status TEXT DEFAULT 'Nouvelle',
    items TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    pass_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS stock_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    created TEXT,
    delta INTEGER,
    reason TEXT,
    stock_after INTEGER
  );

  CREATE TABLE IF NOT EXISTS password_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  `);

  function hasColumn(table, col) {
    return sqlite.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
  }
  if (!hasColumn('products', 'low_stock')) {
    sqlite.exec('ALTER TABLE products ADD COLUMN low_stock INTEGER DEFAULT 3');
  }

  module.exports = {
    async query(text, params = []) {
      const values = normalizeParams(params);
      const sql = String(text).replace(/\$\d+/g, '?');
      const upper = sql.trim().toLowerCase();
      const stmt = sqlite.prepare(sql);
      if (upper.startsWith('select') || upper.startsWith('with') || upper.includes('returning')) {
        return { rows: stmt.all(...values) };
      }
      const result = stmt.run(...values);
      return { rows: [], rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
    },
    async transaction(fn) {
      const run = sqlite.transaction(() => fn({
        query: async (sql, params = []) => {
          const values = normalizeParams(params);
          const prepared = String(sql).replace(/\$\d+/g, '?');
          const stmt = sqlite.prepare(prepared);
          const upper = prepared.trim().toLowerCase();
          if (upper.startsWith('select') || upper.startsWith('with') || upper.includes('returning')) {
            return { rows: stmt.all(...values) };
          }
          const result = stmt.run(...values);
          return { rows: [], rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
        }
      }));
      return run();
    },
    close() {
      sqlite.close();
    }
  };
}
