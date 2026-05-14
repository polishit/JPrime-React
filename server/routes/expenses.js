const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/expenses?total=1  OR  GET /api/expenses
router.get('/', async (req, res) => {
  try {
    if (req.query.total) {
      const [[r]] = await db.query("SELECT COALESCE(SUM(amount),0) total FROM expenses");
      return res.json({ total: parseFloat(r.total) });
    }
    const [rows] = await db.query(
      "SELECT * FROM expenses ORDER BY expenseDate DESC, expenses_id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const d      = req.body;
    const amount = parseFloat(d.amount) || 0;
    if (!d.type || amount <= 0) return res.status(400).json({ error: 'Invalid input' });

    const [result] = await db.query(
      "INSERT INTO expenses (type,amount,expenseDate,notes) VALUES (?,?,?,?)",
      [d.type, amount, d.expenseDate || new Date().toISOString().split('T')[0], d.notes || '']
    );
    res.json({ success: true, expenses_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const d      = req.body;
    const amount = parseFloat(d.amount) || 0;
    if (!d.type || amount <= 0) return res.status(400).json({ error: 'Invalid input' });

    await db.query(
      "UPDATE expenses SET type=?, amount=?, expenseDate=?, notes=? WHERE expenses_id=?",
      [d.type, amount, d.expenseDate || new Date().toISOString().split('T')[0], d.notes || '', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM expenses WHERE expenses_id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;