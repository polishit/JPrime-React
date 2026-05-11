const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username]
    );
    if (rows.length !== 1) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    // Support plain-text (dev) or hashed passwords
    if (password !== user.password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
