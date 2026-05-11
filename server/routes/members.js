const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/members?search=&status=
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const where  = [];
    const params = [];

    if (search) {
      where.push("(m.fullName LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && status !== 'all') {
      where.push("m.status = ?");
      params.push(status);
    }
    const wClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const sql = `
      SELECT m.*, p.name planName,
             GROUP_CONCAT(DISTINCT t.fullName ORDER BY t.fullName SEPARATOR ', ') trainerNames
      FROM members m
      LEFT JOIN plans p              ON p.plan_id  = m.plan_id
      LEFT JOIN trainerAssignments ta ON ta.member_id = m.member_id
      LEFT JOIN trainers t           ON t.trainer_id = ta.trainer_id
      ${wClause}
      GROUP BY m.member_id
      ORDER BY m.created_at DESC
    `;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const planId    = d.plan_id ? parseInt(d.plan_id) : null;
    const trainerId = parseInt(d.trainer_id) || 0;
    const joinDate  = d.joinDate;

    // Compute expiry
    let expiryDate = joinDate;
    if (planId) {
      const [[plan]] = await db.query("SELECT durationMonths FROM plans WHERE plan_id=?", [planId]);
      if (plan) {
        const exp = new Date(joinDate);
        exp.setMonth(exp.getMonth() + plan.durationMonths);
        expiryDate = exp.toISOString().split('T')[0];
      }
    }

    const [result] = await db.query(
      `INSERT INTO members (fullName,gender,dob,phone,email,address,plan_id,joinDate,expiryDate,status)
       VALUES (?,?,?,?,?,?,?,?,?,'active')`,
      [
        d.fullName || '',
        d.gender   || '',
        d.dob      || null,
        d.phone    || null,
        d.email    || null,
        d.address  || '',
        planId     || null,
        joinDate,
        expiryDate,
      ]
    );
    const memberId = result.insertId;
    if (trainerId) {
      await db.query(
        "INSERT INTO trainerAssignments (member_id,trainer_id,assignedDate) VALUES (?,?,?)",
        [memberId, trainerId, joinDate]
      );
    }
    res.json({ success: true, member_id: memberId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const d  = req.body;
    const planId    = d.plan_id ? parseInt(d.plan_id) : null;
    const trainerId = parseInt(d.trainer_id) || 0;
    const joinDate  = d.joinDate || new Date().toISOString().split('T')[0];

    let expiryDate = joinDate;
    if (planId) {
      const [[plan]] = await db.query("SELECT durationMonths FROM plans WHERE plan_id=?", [planId]);
      if (plan) {
        const exp = new Date(joinDate);
        exp.setMonth(exp.getMonth() + plan.durationMonths);
        expiryDate = exp.toISOString().split('T')[0];
      }
    }

    await db.query(
      `UPDATE members SET fullName=?,gender=?,dob=?,phone=?,email=?,address=?,plan_id=?,
       joinDate=?,expiryDate=?,status=? WHERE member_id=?`,
      [
        d.fullName || '',
        d.gender   || '',
        d.dob      || null,
        d.phone    || null,
        d.email    || null,
        d.address  || '',
        planId     || null,
        joinDate,
        expiryDate,
        d.status   || 'active',
        id,
      ]
    );
    // Update trainer assignment
    await db.query("DELETE FROM trainerAssignments WHERE member_id=?", [id]);
    if (trainerId) {
      await db.query(
        "INSERT INTO trainerAssignments (member_id,trainer_id,assignedDate) VALUES (?,?,?)",
        [id, trainerId, joinDate]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM members WHERE member_id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
