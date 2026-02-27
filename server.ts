import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists for persistent storage
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'links.db'));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortCode TEXT UNIQUE NOT NULL,
    originalUrl TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    clicks INTEGER DEFAULT 0
  )
`);

const insertLink = db.prepare('INSERT INTO links (shortCode, originalUrl) VALUES (?, ?)');
const getLinkByCode = db.prepare('SELECT * FROM links WHERE shortCode = ?');
const incrementClicks = db.prepare('UPDATE links SET clicks = clicks + 1 WHERE shortCode = ?');
const getAllLinks = db.prepare('SELECT * FROM links ORDER BY createdAt DESC');

function generateShortCode(length = 6) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/shorten', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(url); // Validate URL
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let shortCode = generateShortCode();
    let isUnique = false;
    
    // Ensure uniqueness
    while (!isUnique) {
      const existing = getLinkByCode.get(shortCode);
      if (!existing) {
        isUnique = true;
      } else {
        shortCode = generateShortCode();
      }
    }

    try {
      insertLink.run(shortCode, url);
      res.json({ shortCode, originalUrl: url });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create short link' });
    }
  });

  app.get('/api/links', (req, res) => {
    try {
      const links = getAllLinks.all();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  });

  // Redirect Route
  app.get('/:shortCode', (req, res, next) => {
    const { shortCode } = req.params;
    
    // Skip API and static routes
    if (shortCode === 'api' || shortCode.includes('.')) {
      return next();
    }

    try {
      const link = getLinkByCode.get(shortCode) as { originalUrl: string } | undefined;
      
      if (link) {
        incrementClicks.run(shortCode);
        res.redirect(link.originalUrl);
      } else {
        next(); // Let Vite handle 404s
      }
    } catch (error) {
      next(error);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
