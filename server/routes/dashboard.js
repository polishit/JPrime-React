const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const [[{ total }]]    = await db.query("SELECT COUNT(*) total FROM members");
    const [[{ active }]]   = await db.query("SELECT COUNT(*) active FROM members WHERE status='active'");
    const [[{ expired }]]  = await db.query("SELECT COUNT(*) expired FROM members WHERE status='expired'");
    const [[{ frozen }]]   = await db.query("SELECT COUNT(*) frozen FROM members WHERE status='frozen'");
    const [[{ todayCI }]]  = await db.query("SELECT COUNT(*) todayCI FROM attendance WHERE DATE(checkIn)=CURDATE()");
    const [[{ trainers }]] = await db.query("SELECT COUNT(*) trainers FROM trainers WHERE is_active=1");
    const [[{ income }]]   = await db.query("SELECT COALESCE(SUM(amount),0) income FROM payments");
    const [[{ expenses }]] = await db.query("SELECT COALESCE(SUM(amount),0) expenses FROM expenses");
    const profit = parseFloat(income) - parseFloat(expenses);

    // Monthly income vs expenses (12 months current year)
    const monthly = [];
    const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let m = 1; m <= 12; m++) {
      const [[r1]] = await db.query(
        "SELECT COALESCE(SUM(amount),0) s FROM payments WHERE YEAR(paymentDate)=? AND MONTH(paymentDate)=?",
        [year, m]
      );
      const [[r2]] = await db.query(
        "SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE YEAR(expenseDate)=? AND MONTH(expenseDate)=?",
        [year, m]
      );
      monthly.push({ month: months[m - 1], income: parseFloat(r1.s), expenses: parseFloat(r2.s) });
    }

    // Plan distribution
   const [planDist] = await db.query(
  "SELECT p.name, COUNT(m.member_id) cnt FROM plans p INNER JOIN members m ON m.plan_id=p.plan_id GROUP BY p.plan_id HAVING cnt > 0 ORDER BY p.plan_id"
);

    // Recent payments (last 10)
    const [recentPayments] = await db.query(
      `SELECT m.fullName, p.name planName, py.amount, py.paymentMode, py.paymentDate
       FROM payments py
       JOIN members m ON m.member_id=py.member_id
       LEFT JOIN plans p ON p.plan_id=py.plan_id
       ORDER BY py.paymentDate DESC, py.payments_id DESC LIMIT 10`
    );

    res.json({
      stats: { total, active, expired, frozen, todayCI, trainers, income, expenses, profit },
      monthly,
      planDist,
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
