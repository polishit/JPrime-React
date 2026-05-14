const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/payments?total=1  OR  GET /api/payments
router.get('/', async (req, res) => {
  try {
    if (req.query.total) {
      const [[r]] = await db.query("SELECT COALESCE(SUM(amount),0) total FROM payments");
      return res.json({ total: parseFloat(r.total) });
    }
    const [rows] = await db.query(
      `SELECT py.payments_id, m.fullName, p.name planName,
              py.member_id, py.plan_id,
              py.amount, py.paymentMode, py.paymentDate, py.remarks
       FROM payments py
       JOIN members m ON m.member_id = py.member_id
       LEFT JOIN plans p ON p.plan_id = py.plan_id
       ORDER BY py.paymentDate DESC, py.payments_id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const memberId = parseInt(d.member_id) || 0;
    const planId   = d.plan_id ? parseInt(d.plan_id) : null;
    const amount   = parseFloat(d.amount)  || 0;
    if (!memberId || amount <= 0)
      return res.status(400).json({ error: 'Invalid input' });

    const [result] = await db.query(
      "INSERT INTO payments (member_id,plan_id,amount,paymentDate,paymentMode,remarks) VALUES (?,?,?,?,?,?)",
      [memberId, planId, amount, d.paymentDate || new Date().toISOString().split('T')[0],
       d.paymentMode || 'Cash', d.remarks || '']
    );
    res.json({ success: true, payment_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const memberId = parseInt(d.member_id) || 0;
    const planId   = d.plan_id ? parseInt(d.plan_id) : null;
    const amount   = parseFloat(d.amount)  || 0;
    if (!memberId || amount <= 0)
      return res.status(400).json({ error: 'Invalid input' });

    await db.query(
      "UPDATE payments SET member_id=?, plan_id=?, amount=?, paymentDate=?, paymentMode=?, remarks=? WHERE payments_id=?",
      [memberId, planId, amount,
       d.paymentDate || new Date().toISOString().split('T')[0],
       d.paymentMode || 'Cash', d.remarks || '',
       req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM payments WHERE payments_id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;