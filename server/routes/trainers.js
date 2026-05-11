const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/trainers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, COUNT(DISTINCT ta.member_id) memberCount
       FROM trainers t
       LEFT JOIN trainerAssignments ta ON ta.trainer_id = t.trainer_id
       WHERE t.is_active = 1
       GROUP BY t.trainer_id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trainers
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d.fullName) return res.status(400).json({ error: 'Name required' });

    const [result] = await db.query(
      "INSERT INTO trainers (fullName,phone,specialization) VALUES (?,?,?)",
      [d.fullName, d.phone || '', d.specialization || '']
    );
    res.json({ success: true, trainer_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// DELETE /api/trainers/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM trainers WHERE trainer_id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
