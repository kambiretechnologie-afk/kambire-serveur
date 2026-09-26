/* ===== Serveur KAMBIRE INFORMATIQUE ===== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'kambire-secret-change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Lemourte1@';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kambiretechnologie.com';
const VALIDATION_CODE_TTL_MINUTES = Number(process.env.VALIDATION_CODE_TTL_MINUTES || 10);

function generateValidationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function storeValidationCode(username, email, code) {
  const now = new Date();
  const expires = new Date(now.getTime() + VALIDATION_CODE_TTL_MINUTES * 60 * 1000).toISOString();
  await dbRun('DELETE FROM password_codes WHERE username = $1', [username]);
  await dbRun('INSERT INTO password_codes (username, email, code, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)', [
    username, email, code, now.toISOString(), expires
  ]);
  return { expiresAt: expires };
}

async function validateCode(username, code) {
  const cleanUser = String(username || '').trim();
  const cleanCode = String(code || '').trim();
  if (!cleanUser || !cleanCode) return null;
  const row = await dbGet('SELECT * FROM password_codes WHERE username = $1 AND code = $2 ORDER BY id DESC LIMIT 1', [cleanUser, cleanCode]);
  if (!row) return null;
  const expiresAt = new Date(row.expires_at || row.created_at || Date.now());
  if (Date.now() > expiresAt.getTime()) {
    await dbRun('DELETE FROM password_codes WHERE username = $1', [cleanUser]);
    return null;
  }
  return row;
}

async function clearValidationCode(username) {
  await dbRun('DELETE FROM password_codes WHERE username = $1', [username]);
}

async function ensureDefaultAdmin() {
  const existing = await dbGet('SELECT * FROM admins WHERE username = $1', [ADMIN_USER]);
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);

  if (!existing) {
    await dbRun('INSERT INTO admins (username, pass_hash) VALUES ($1, $2)', [ADMIN_USER, hash]);
    return;
  }

  if (!bcrypt.compareSync(ADMIN_PASS, existing.pass_hash)) {
    await dbRun('UPDATE admins SET pass_hash = $1 WHERE username = $2', [hash, ADMIN_USER]);
  }
}

async function sendValidationCodeEmail(email, code) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!nodemailer || !smtpHost || !smtpUser || !smtpPass) {
    console.log(`[EMAIL TEST] Code de validation KAMBIRE : ${code} -> ${email}`);
    return { devMode: true, code };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: smtpUser, pass: smtpPass }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to: email,
    subject: 'Code de validation KAMBIRE',
    text: `Votre code de validation KAMBIRE est : ${code}. Il expire dans ${VALIDATION_CODE_TTL_MINUTES} minutes.`,
    html: `<p>Votre code de validation KAMBIRE est : <strong>${code}</strong>.</p><p>Il expire dans ${VALIDATION_CODE_TTL_MINUTES} minutes.</p>`
  });
  return { devMode: false, code };
}

function ensurePasswordStrength(password) {
  const p = String(password || '').trim();
  return p.length >= 6;
}

async function dbGet(sql, params = []) {
  if (db.prepare) return db.prepare(sql).get(...params);
  const result = await db.query(sql, params);
  return result.rows[0] || null;
}
async function dbAll(sql, params = []) {
  if (db.prepare) return db.prepare(sql).all(...params);
  const result = await db.query(sql, params);
  return result.rows || [];
}
async function dbRun(sql, params = []) {
  if (db.prepare) return db.prepare(sql).run(...params);
  const result = await db.query(sql, params);
  return { changes: result.rowCount || 0, lastInsertRowid: result.rows?.[0]?.id || null };
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---- Helpers ---- */
function rowToProduct(r) {
  if (!r) return null;
  const stock = r.stock, low = r.low_stock == null ? 3 : r.low_stock;
  return {
    id: 'p' + r.id, dbId: r.id, name: r.name, cat: r.cat, brand: r.brand,
    price: r.price, old: r.old, gen: r.gen, cpu: r.cpu, ram: r.ram, ssd: r.ssd,
    tactile: !!r.tactile, dispo: !!r.dispo, promo: !!r.promo, neuf: !!r.neuf,
    rating: r.rating, sold: r.sold, stock: stock, low_stock: low,
    stockStatus: stockStatus(stock, low),
    img: r.img,
    gallery: safeJSON(r.gallery, [r.img]), desc: r.descr, specs: safeJSON(r.specs, {})
  };
}
function stockStatus(stock, low) {
  if (stock <= 0) return 'rupture';
  if (stock <= low) return 'faible';
  return 'ok';
}
function safeJSON(s, d) { try { return JSON.parse(s); } catch (e) { return d; } }
function pid(id) { return parseInt(String(id).replace(/^p/, ''), 10); }

/* ---- Auth middleware ---- */
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non autorise' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: 'Session expiree' }); }
}

/* ================= AUTH ================= */
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  const a = await dbGet('SELECT * FROM admins WHERE username = $1', [username]);
  if (!a || !bcrypt.compareSync(password || '', a.pass_hash))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign({ id: a.id, username: a.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: a.username });
});

app.post('/api/admin/request-password-code', async (req, res) => {
  const { username } = req.body || {};
  const cleanUser = String(username || '').trim();
  if (!cleanUser) {
    return res.status(400).json({ error: 'Nom d\'utilisateur requis' });
  }

  const admin = await dbGet('SELECT * FROM admins WHERE username = $1', [cleanUser]);
  if (!admin) return res.status(404).json({ error: 'Compte administrateur introuvable' });

  const email = ADMIN_EMAIL;
  const code = generateValidationCode();
  await storeValidationCode(cleanUser, email, code);
  const mailResult = await sendValidationCodeEmail(email, code);

  res.json({
    ok: true,
    message: mailResult.devMode
      ? `Code de validation généré en mode local. Le code est : ${code}.` 
      : `Un code de validation a été envoyé à ${email}.`,
    email,
    code: mailResult.devMode ? code : undefined,
    devMode: mailResult.devMode
  });
});

app.post('/api/admin/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword, validationCode } = req.body || {};
  const username = req.admin.username;
  const admin = await dbGet('SELECT * FROM admins WHERE username = $1', [username]);

  if (!admin) return res.status(404).json({ error: 'Compte introuvable' });
  if (!bcrypt.compareSync(String(currentPassword || ''), admin.pass_hash)) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  }
  if (!validationCode) {
    return res.status(400).json({ error: 'Le code de validation est requis avant le changement de mot de passe' });
  }
  if (!await validateCode(username, validationCode)) {
    return res.status(401).json({ error: 'Code de validation invalide ou expiré' });
  }
  if (!ensurePasswordStrength(newPassword)) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  const hash = bcrypt.hashSync(String(newPassword), 10);
  await dbRun('UPDATE admins SET pass_hash = $1 WHERE username = $2', [hash, username]);
  await clearValidationCode(username);
  res.json({ ok: true, message: 'Mot de passe mis à jour avec succès' });
});

app.post('/api/admin/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanCode = String(code || '').trim();

  if (!cleanUser || !cleanCode || !newPassword) {
    return res.status(400).json({ error: 'Nom d\'utilisateur, code de validation et nouveau mot de passe requis' });
  }
  if (!ensurePasswordStrength(newPassword)) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  const admin = await dbGet('SELECT * FROM admins WHERE username = $1', [cleanUser]);
  if (!admin) return res.status(404).json({ error: 'Compte administrateur introuvable' });
  if (!await validateCode(cleanUser, cleanCode)) {
    return res.status(401).json({ error: 'Code de validation invalide ou expiré' });
  }

  const hash = bcrypt.hashSync(String(newPassword), 10);
  await dbRun('UPDATE admins SET pass_hash = $1 WHERE username = $2', [hash, cleanUser]);
  await clearValidationCode(cleanUser);
  res.json({ ok: true, message: 'Mot de passe réinitialisé avec succès' });
});

/* ================= PRODUITS ================= */
app.get('/api/products', async (req, res) => {
  const rows = await dbAll('SELECT * FROM products ORDER BY id DESC');
  res.json(rows.map(rowToProduct));
});
app.get('/api/products/:id', async (req, res) => {
  const r = await dbGet('SELECT * FROM products WHERE id = $1', [pid(req.params.id)]);
  if (!r) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(rowToProduct(r));
});
app.post('/api/products', auth, async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.price) return res.status(400).json({ error: 'Nom et prix requis' });
  const raw = normalize(b);
  const info = await dbRun(`INSERT INTO products (name,cat,brand,price,old,gen,cpu,ram,ssd,tactile,dispo,promo,neuf,rating,sold,stock,low_stock,img,gallery,descr,specs)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`, [
    raw.name, raw.cat, raw.brand, raw.price, raw.old, raw.gen, raw.cpu, raw.ram, raw.ssd,
    raw.tactile, raw.dispo, raw.promo, raw.neuf, raw.rating, raw.sold, raw.stock, raw.low_stock,
    raw.img, raw.gallery, raw.descr, raw.specs
  ]);
  const id = info.lastInsertRowid || info.rows?.[0]?.id || null;
  const row = id ? await dbGet('SELECT * FROM products WHERE id = $1', [id]) : null;
  res.json(rowToProduct(row));
});
app.put('/api/products/:id', auth, async (req, res) => {
  const id = pid(req.params.id);
  const cur = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
  if (!cur) return res.status(404).json({ error: 'Produit introuvable' });
  const merged = normalize({ ...rowToProduct(cur), ...req.body, id });
  await dbRun(`UPDATE products SET name=$1,cat=$2,brand=$3,price=$4,old=$5,gen=$6,cpu=$7,ram=$8,ssd=$9,tactile=$10,dispo=$11,promo=$12,neuf=$13,rating=$14,sold=$15,stock=$16,low_stock=$17,img=$18,gallery=$19,descr=$20,specs=$21 WHERE id=$22`, [
    merged.name, merged.cat, merged.brand, merged.price, merged.old, merged.gen, merged.cpu, merged.ram,
    merged.ssd, merged.tactile, merged.dispo, merged.promo, merged.neuf, merged.rating, merged.sold,
    merged.stock, merged.low_stock, merged.img, merged.gallery, merged.descr, merged.specs, id
  ]);
  const row = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
  res.json(rowToProduct(row));
});
app.delete('/api/products/:id', auth, async (req, res) => {
  await dbRun('DELETE FROM products WHERE id = $1', [pid(req.params.id)]);
  res.json({ ok: true });
});

function normalize(b) {
  return {
    name: b.name, cat: b.cat || 'Accessoires', brand: b.brand || b.cat || '',
    price: parseInt(b.price) || 0, old: parseInt(b.old) || 0,
    gen: b.gen || '-', cpu: b.cpu || '-', ram: parseInt(b.ram) || 0, ssd: parseInt(b.ssd) || 0,
    tactile: b.tactile ? 1 : 0, dispo: b.dispo ? 1 : 0, promo: b.promo ? 1 : 0, neuf: b.neuf ? 1 : 0,
    rating: parseInt(b.rating) || 5, sold: parseInt(b.sold) || 0, stock: parseInt(b.stock) || 0,
    low_stock: b.low_stock == null || b.low_stock === '' ? 3 : (parseInt(b.low_stock) || 0),
    img: b.img || '', gallery: JSON.stringify(b.gallery || (b.img ? [b.img] : [])),
    descr: b.desc || b.descr || '', specs: JSON.stringify(b.specs || {})
  };
}

/* ================= COMMANDES ================= */
app.post('/api/orders', async (req, res) => {
  const b = req.body || {};
  if (!b.client || !b.phone || !Array.isArray(b.items) || !b.items.length)
    return res.status(400).json({ error: 'Commande invalide' });
  const ref = 'KB' + Date.now().toString().slice(-8);
  const now = new Date().toISOString();

  try {
    await dbRun(`INSERT INTO orders (ref,created,client,phone,email,zone,addr,note,pay,ship_cost,total,status,items)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
      ref, now, b.client, b.phone, b.email || '', b.zone || '', b.addr || '',
      b.note || '', b.pay || '', parseInt(b.ship_cost) || 0, parseInt(b.total) || 0, 'Nouvelle', JSON.stringify(b.items)
    ]);

    for (const it of b.items) {
      const id = pid(it.id);
      const p = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
      if (!p) continue;
      const qty = parseInt(it.qty) || 1;
      const newStock = Math.max(0, p.stock - qty);
      const dispo = newStock > 0 ? p.dispo : 0;
      await dbRun('UPDATE products SET stock=$1, dispo=$2, sold=sold+$3 WHERE id=$4', [newStock, dispo, qty, id]);
      await dbRun('INSERT INTO stock_moves (product_id,created,delta,reason,stock_after) VALUES ($1,$2,$3,$4,$5)', [id, now, -qty, 'Vente ' + ref, newStock]);
    }

    res.json({ ok: true, ref });
  } catch (error) {
    console.error('Erreur commande :', error);
    res.status(500).json({ error: 'Impossible de traiter la commande' });
  }
});
// Suivi public d'une commande (par reference + telephone, sans authentification)
app.get('/api/orders/track', async (req, res) => {
  const ref = String(req.query.ref || '').trim().toUpperCase();
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  if (!ref || !phone) return res.status(400).json({ error: 'Reference et telephone requis' });
  const o = await dbGet('SELECT * FROM orders WHERE UPPER(ref) = $1', [ref]);
  // Verification du telephone (on ignore les espaces/indicatifs) pour proteger la vie privee
  if (!o || String(o.phone || '').replace(/\D/g, '') !== phone) {
    return res.status(404).json({ error: 'Aucune commande ne correspond a ces informations' });
  }
  res.json({
    ref: o.ref, created: o.created, status: o.status, client: o.client,
    zone: o.zone, addr: o.addr, pay: o.pay, ship_cost: o.ship_cost,
    total: o.total, items: safeJSON(o.items, [])
  });
});

app.get('/api/orders', auth, async (req, res) => {
  const rows = await dbAll('SELECT * FROM orders ORDER BY id DESC');
  res.json(rows.map(o => ({ ...o, items: safeJSON(o.items, []) })));
});
app.put('/api/orders/:id/status', auth, async (req, res) => {
  await dbRun('UPDATE orders SET status=$1 WHERE id=$2', [req.body.status, parseInt(req.params.id)]);
  res.json({ ok: true });
});

/* ================= CLIENTS ================= */
app.get('/api/clients', auth, async (req, res) => {
  const rows = await dbAll('SELECT client,phone,email,total FROM orders');
  const map = {};
  rows.forEach(o => {
    if (!map[o.phone]) map[o.phone] = { name: o.client, phone: o.phone, email: o.email, count: 0, total: 0 };
    map[o.phone].count++; map[o.phone].total += o.total;
  });
  res.json(Object.values(map));
});

/* ================= STATISTIQUES ================= */
app.get('/api/stats', auth, async (req, res) => {
  const revenue = (await dbGet("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status!='Annulee'", [])).s;
  const ordersCount = (await dbGet('SELECT COUNT(*) c FROM orders')).c;
  const productsCount = (await dbGet('SELECT COUNT(*) c FROM products')).c;
  const clients = (await dbGet('SELECT COUNT(DISTINCT phone) c FROM orders')).c;
  const lowStockCount = (await dbGet('SELECT COUNT(*) c FROM products WHERE stock>0 AND stock<=low_stock')).c;
  const outOfStockCount = (await dbGet('SELECT COUNT(*) c FROM products WHERE stock<=0')).c;
  res.json({ revenue, ordersCount, productsCount, clients, lowStockCount, outOfStockCount });
});

/* ================= STOCK ================= */
// Liste des produits en alerte (stock faible ou rupture)
app.get('/api/stock/alerts', auth, async (req, res) => {
  const rows = await dbAll('SELECT * FROM products WHERE stock<=low_stock ORDER BY stock ASC');
  res.json(rows.map(rowToProduct));
});

// Historique des mouvements de stock (optionnel: ?product=pID)
app.get('/api/stock/moves', auth, async (req, res) => {
  let rows;
  if (req.query.product) {
    rows = await dbAll('SELECT * FROM stock_moves WHERE product_id=$1 ORDER BY id DESC LIMIT 100', [pid(req.query.product)]);
  } else {
    rows = await dbAll('SELECT * FROM stock_moves ORDER BY id DESC LIMIT 100');
  }
  res.json(rows);
});

// Ajustement / reapprovisionnement du stock (delta relatif ou set absolu)
app.post('/api/products/:id/stock', auth, async (req, res) => {
  const id = pid(req.params.id);
  const p = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  const b = req.body || {};
  let newStock, delta;
  if (b.set != null && b.set !== '') {
    newStock = Math.max(0, parseInt(b.set) || 0);
    delta = newStock - p.stock;
  } else {
    delta = parseInt(b.delta) || 0;
    newStock = Math.max(0, p.stock + delta);
  }
  const now = new Date().toISOString();
  const reason = b.reason || (delta >= 0 ? 'Reapprovisionnement' : 'Ajustement');
  const dispo = newStock > 0 ? (b.dispo != null ? (b.dispo ? 1 : 0) : p.dispo) : 0;
  await dbRun('UPDATE products SET stock=$1, dispo=$2 WHERE id=$3', [newStock, dispo, id]);
  if (delta !== 0) await dbRun('INSERT INTO stock_moves (product_id,created,delta,reason,stock_after) VALUES ($1,$2,$3,$4,$5)', [id, now, delta, reason, newStock]);
  const updated = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
  res.json(rowToProduct(updated));
});

/* ---- Fallback ---- */
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

ensureDefaultAdmin().then(() => {
  app.listen(PORT, HOST, () => {
    console.log('\n\u2705 KAMBIRE INFORMATIQUE en ligne sur http://localhost:' + PORT);
    console.log('   Admin : http://localhost:' + PORT + '/admin.html\n');
  });
}).catch((err) => {
  console.error('Erreur initialisation admin :', err);
  app.listen(PORT, HOST, () => {
    console.log('\n\u2705 KAMBIRE INFORMATIQUE en ligne sur http://localhost:' + PORT);
    console.log('   Admin : http://localhost:' + PORT + '/admin.html\n');
  });
});
