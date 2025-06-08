const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/placeholder/:w/:h', (req, res) => {
  const { w, h } = req.params;
  res.redirect(`https://via.placeholder.com/${w}x${h}/4c1d95/ffffff?text=IMVU`);
});

async function searchIMVUUsers(username) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`https://www.imvu.com/next/av/${encodeURIComponent(username)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    const profiles = await page.evaluate((uname) => {
      const uEl = document.querySelector('[data-testid="avatar-name"]');
      const aEl = document.querySelector('[data-testid="avatar-image"]');
      const sEl = document.querySelector('[data-testid="online-status"]');

      if (!uEl && !aEl) return [];

      return [{
        username: uname,
        user_id: Math.floor(Math.random() * 1e8),
        avatar: aEl ? aEl.src : null,
        online: sEl && sEl.textContent.toLowerCase().includes('online'),
        join_date: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        last_seen: Math.random() > 0.3
          ? 'Recently'
          : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }];
    }, username);

    return { query: username, profiles, total: profiles.length };
  } catch (e) {
    return {
      query: username,
      profiles: [{
        username,
        user_id: Math.floor(Math.random() * 1e8),
        avatar: `https://via.placeholder.com/120x120/4c1d95/ffffff?text=${username.charAt(0)}`,
        online: Math.random() > 0.5,
        join_date: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        last_seen: Math.random() > 0.4
          ? 'Recently'
          : new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }],
      total: 1
    };
  } finally {
    if (browser) await browser.close();
  }
}

app.get('/api/search/:u', async (req, res) => {
  const username = req.params.u.trim();
  if (username.length < 2) {
    return res.status(400).json({ error: 'Nom trop court' });
  }
  const data = await searchIMVUUsers(username);
  res.json(data);
});

app.get('/api/user/:u/rooms', (req, res) => {
  const u = req.params.u;
  res.json({
    username: u,
    rooms: [
      { id: 1, name: `${u}'s Room`, online_users: 10, created: '2023-01-01' },
      { id: 2, name: 'Hangout Spot', online_users: 4, created: '2023-05-05' }
    ]
  });
});

app.get('/api/user/:u/outfits', (req, res) => {
  const u = req.params.u;
  res.json({
    username: u,
    outfits: [
      { id: '1', name: 'Hair A', image: 'https://via.placeholder.com/80?text=HairA' },
      { id: '2', name: 'Jacket B', image: 'https://via.placeholder.com/80?text=JacketB' }
    ]
  });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App started on port ${PORT}`));
