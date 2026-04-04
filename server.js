require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const app = express();
app.use(cors({
  origin: [
    'https://rosybrown-guanaco-429766.hostingersite.com',
    'https://lightsalmon-scorpion-346869.hostingersite.com',
    'https://seashell-partridge-597593.hostingersite.com',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true
}));
app.use(express.json());

// ─── Static uploads ───────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// ─── Upload ───────────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Return relative path — frontend prepends API_BASE_URL so it works on any host
  const relativePath = `/uploads/${req.file.filename}`;
  res.json({ url: relativePath });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseProduct = (p) => ({
  ...p,
  features: JSON.parse(p.features || '[]'),
  images: JSON.parse(p.images || '[]'),
});

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, username, password FROM admin_users WHERE username = ?', [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = crypto.randomBytes(32).toString('hex');
    res.json({ success: true, token, user: { id: rows[0].id, username: rows[0].username } });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Products ────────────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Product not found' });
      return res.json(parseProduct(rows[0]));
    }
    const [rows] = await pool.query('SELECT * FROM products ORDER BY sort_order ASC');
    res.json(rows.map(parseProduct));
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, category, short_desc, description, features, images, image_url, sort_order } = req.body;
    if (!id || !name || !category) return res.status(400).json({ error: 'id, name and category are required' });
    await pool.query(
      'INSERT INTO products (id, name, category, short_desc, description, features, images, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, short_desc, description, JSON.stringify(features || []), JSON.stringify(images || []), image_url || null, sort_order || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/products', async (req, res) => {
  try {
    const { id, name, category, short_desc, description, features, images, image_url, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const [result] = await pool.query(
      'UPDATE products SET name=?, category=?, short_desc=?, description=?, features=?, images=?, image_url=?, sort_order=? WHERE id=?',
      [name, category, short_desc, description, JSON.stringify(features || []), JSON.stringify(images || []), image_url || null, sort_order || 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/products', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Enquiries ───────────────────────────────────────────────────────────────
app.get('/api/enquiries', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, p.name as product_name FROM enquiries e LEFT JOIN products p ON e.product_id = p.id ORDER BY e.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get enquiries error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/enquiries', async (req, res) => {
  try {
    const { name, email, phone, message, product_id } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message are required' });
    const [result] = await pool.query(
      'INSERT INTO enquiries (name, email, phone, message, product_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, message, product_id || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create enquiry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/enquiries', async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status are required' });
    const [result] = await pool.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Update enquiry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/enquiries', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete enquiry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Blog ─────────────────────────────────────────────────────────────────────
app.get('/api/blogs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs ORDER BY sort_order ASC, created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/blogs', async (req, res) => {
  try {
    const { title, excerpt, content, image_url, author, date, sort_order } = req.body;
    if (!title || !excerpt) return res.status(400).json({ error: 'title and excerpt are required' });
    const [result] = await pool.query(
      'INSERT INTO blogs (title, excerpt, content, image_url, author, date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, excerpt, content || '', image_url || null, author || 'Admin', date || new Date().toISOString().split('T')[0], sort_order || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/blogs', async (req, res) => {
  try {
    const { id, title, excerpt, content, image_url, author, date, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await pool.query(
      'UPDATE blogs SET title=?, excerpt=?, content=?, image_url=?, author=?, date=?, sort_order=? WHERE id=?',
      [title, excerpt, content || '', image_url || null, author || 'Admin', date, sort_order || 0, id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/blogs', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await pool.query('DELETE FROM blogs WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── FAQ ─────────────────────────────────────────────────────────────────────
app.get('/api/faqs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM faqs ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/faqs', async (req, res) => {
  try {
    const { question, answer, sort_order } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });
    const [result] = await pool.query(
      'INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)',
      [question, answer, sort_order || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/faqs', async (req, res) => {
  try {
    const { id, question, answer, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await pool.query(
      'UPDATE faqs SET question=?, answer=?, sort_order=? WHERE id=?',
      [question, answer, sort_order || 0, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/faqs', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await pool.query('DELETE FROM faqs WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Site Content ───────────────────────────────────────────────────────────
app.get('/api/content', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_content');
    const content = {};
    rows.forEach(r => { content[r.key_name] = r.value; });
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/content', async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'INSERT INTO site_content (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, value, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Gallery ─────────────────────────────────────────────────────────────────
app.get('/api/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { url, alt, sort_order } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    const [result] = await pool.query(
      'INSERT INTO gallery (url, alt, sort_order) VALUES (?, ?, ?)',
      [url, alt || '', sort_order || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/gallery', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Test ─────────────────────────────────────────────────────────────────────
app.get('/api/test', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'success', message: 'Database connection successful', database: process.env.DB_NAME });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', async (req, res) => {
  let dbStatus = 'connected';
  let dbColor = '#22c55e';
  let dbIcon = '✅';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
    dbColor = '#ef4444';
    dbIcon = '❌';
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Abdul Gani Hazi Gulam Mohd — API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px 48px; max-width: 560px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.4); }
    .logo { font-size: 48px; margin-bottom: 12px; }
    .brand { font-size: 22px; font-weight: 700; color: #f8fafc; letter-spacing: 0.5px; }
    .tagline { font-size: 13px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .divider { border: none; border-top: 1px solid #334155; margin: 28px 0; }
    .badge { display: inline-block; background: #166534; color: #86efac; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 20px; letter-spacing: 0.5px; }
    .db-status { display: flex; align-items: center; justify-content: center; gap: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px 20px; margin: 20px 0; }
    .db-dot { width: 10px; height: 10px; border-radius: 50%; background: ${dbColor}; box-shadow: 0 0 8px ${dbColor}; }
    .db-label { font-size: 14px; color: #cbd5e1; }
    .db-value { font-size: 14px; font-weight: 600; color: ${dbColor}; }
    .endpoints { text-align: left; margin-top: 24px; }
    .endpoints h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
    .ep { display: flex; align-items: center; gap-10px; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8; gap: 8px; }
    .method { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; min-width: 44px; text-align: center; }
    .get  { background: #1d4ed8; color: #bfdbfe; }
    .post { background: #15803d; color: #bbf7d0; }
    .put  { background: #b45309; color: #fde68a; }
    .del  { background: #b91c1c; color: #fecaca; }
    .footer { margin-top: 28px; font-size: 12px; color: #475569; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🌾</div>
    <div class="brand">ABDUL GANI HAZI GULAM MOHD</div>
    <div class="tagline">Agricultural Equipment — Backend API</div>
    <hr class="divider" />
    <span class="badge">v1.0.0 · LIVE</span>

    <div class="db-status">
      <div class="db-dot"></div>
      <span class="db-label">Database:</span>
      <span class="db-value">${dbIcon} ${dbStatus}</span>
    </div>

    <div class="endpoints">
      <h3>Available Endpoints</h3>
      <div class="ep"><span class="method get">GET</span> /api/products</div>
      <div class="ep"><span class="method post">POST</span> /api/products</div>
      <div class="ep"><span class="method put">PUT</span> /api/products</div>
      <div class="ep"><span class="method del">DEL</span> /api/products</div>
      <div class="ep"><span class="method post">POST</span> /api/auth</div>
      <div class="ep"><span class="method get">GET</span> /api/enquiries</div>
      <div class="ep"><span class="method post">POST</span> /api/enquiries</div>
      <div class="ep"><span class="method put">PUT</span> /api/enquiries</div>
      <div class="ep"><span class="method del">DEL</span> /api/enquiries</div>
      <div class="ep"><span class="method get">GET</span> /api/test</div>
    </div>

    <div class="footer">
      Powered by <strong>Marketvry</strong> &nbsp;·&nbsp;
      <a href="https://rosybrown-guanaco-429766.hostingersite.com" target="_blank">Visit Website →</a>
    </div>
  </div>
</body>
</html>`);
});

app.get('/api', (req, res) => res.json({
  status: 'ok',
  endpoints: {
    auth:      { login: 'POST /api/auth' },
    products:  { list: 'GET /api/products', get: 'GET /api/products?id=', create: 'POST /api/products', update: 'PUT /api/products', delete: 'DELETE /api/products' },
    enquiries: { list: 'GET /api/enquiries', create: 'POST /api/enquiries', update: 'PUT /api/enquiries', delete: 'DELETE /api/enquiries' },
    test:      'GET /api/test'
  }
}));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err.message));
