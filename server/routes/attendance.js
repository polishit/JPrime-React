const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/attendance          → today's check-ins
// GET /api/attendance?active_members=1 → active members list
router.get('/', async (req, res) => {
  try {
    if (req.query.active_members) {
      const [rows] = await db.query(
        "SELECT member_id, fullName FROM members WHERE status='active' ORDER BY fullName"
      );
      return res.json(rows);
    }
    const [rows] = await db.query(
      `SELECT a.attendance_id, m.fullName, a.checkIn
       FROM attendance a
       JOIN members m ON m.member_id = a.member_id
       WHERE DATE(a.checkIn) = CURDATE()
       ORDER BY a.checkIn DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance
router.post('/', async (req, res) => {
  try {
    const memberId = parseInt(req.body.member_id) || 0;
    if (!memberId) return res.status(400).json({ error: 'No member selected' });

    // Check already checked in today
    const [[chk]] = await db.query(
      "SELECT COUNT(*) cnt FROM attendance WHERE member_id=? AND DATE(checkIn)=CURDATE()",
      [memberId]
    );
    if (chk.cnt > 0) return res.status(409).json({ error: 'Member already checked in today' });

    await db.query("INSERT INTO attendance (member_id) VALUES (?)", [memberId]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
