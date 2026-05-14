const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/plans
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, COUNT(m.member_id) memberCount
       FROM plans p
       LEFT JOIN members m ON m.plan_id = p.plan_id
       WHERE p.is_active = 1
       GROUP BY p.plan_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plans
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d.name || !d.durationMonths || d.durationMonths < 1 || d.price < 0)
      return res.status(400).json({ error: 'Invalid input' });

    const [result] = await db.query(
      "INSERT INTO plans (name,durationMonths,price,description) VALUES (?,?,?,?)",
      [d.name, parseInt(d.durationMonths), parseFloat(d.price), d.description || '']
    );
    res.json({ success: true, plan_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    if (!d.name || !d.durationMonths || d.durationMonths < 1 || d.price < 0)
      return res.status(400).json({ error: 'Invalid input' });

    await db.query(
      "UPDATE plans SET name=?, durationMonths=?, price=?, description=? WHERE plan_id=?",
      [d.name, parseInt(d.durationMonths), parseFloat(d.price), d.description || '', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/plans/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM plans WHERE plan_id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;