import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const user = sessionStorage.getItem('ft_user') || 'admin';
  const { toast, showToast } = useToast();
  const [data, setData] = useState(null);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      const d   = await res.json();
      setData(d);
    } catch (e) {
      showToast('Failed to load dashboard data.', 'error');
    }
  }

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data?.stats || {};
  const monthly = data?.monthly || [];
  const planDist = data?.planDist || [];
  const recentPayments = data?.recentPayments || [];

  const planColors = ['#ffa500','#22c55e','#1d7ed6','#a855f7','#f43f5e','#14b8a6'];

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [
      { label: 'Income',   data: monthly.map(m => m.income),   backgroundColor: '#ffa500' },
      { label: 'Expenses', data: monthly.map(m => m.expenses), backgroundColor: '#bfc5cf' },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => '₱' + v.toLocaleString() } },
    },
  };

  const donutData = {
    labels: planDist.map(p => p.name),
    datasets: [{
      data: planDist.map(p => p.cnt),
      backgroundColor: planColors.slice(0, planDist.length),
    }],
  };

  const donutOptions = {
    cutout: '65%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  const profit = parseFloat(stats.profit || 0);

  const statCards = [
    { id: 'total',    icon: 'fa-user-group',         label: 'Total Members',    value: stats.total },
    { id: 'active',   icon: 'fa-user-check',          label: 'Active Members',   value: stats.active },
    { id: 'expired',  icon: 'fa-user-xmark',          label: 'Expired',          value: stats.expired },
    { id: 'checkin',  icon: 'fa-calendar-check',      label: "Today's Check-In", value: stats.todayCI },
    { id: 'income',   icon: 'fa-money-bill-trend-up', label: 'Total Income',     value: fmt(stats.income   || 0) },
    { id: 'expenses', icon: 'fa-receipt',             label: 'Total Expenses',   value: fmt(stats.expenses || 0) },
    { id: 'profit',   icon: 'fa-coins',               label: 'Net Profit',
      value: (profit < 0 ? '-' : '') + fmt(Math.abs(profit)),
      color: profit >= 0 ? '#278727' : '#e53e3e' },
    { id: 'trainers', icon: 'fa-dumbbell',            label: 'Active Trainers',  value: stats.trainers },
  ];

  return (
    <>
      <Toast toast={toast} />
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-upper">
          {/* Welcome */}
          <div className="dashboard-welcome">
            <h1>Welcome back, <span>{user}</span></h1>
            <p>Here's what's happening at JPrime Fitness Gym today.</p>
          </div>

          {/* Stat Cards */}
          <div className="dashboard-grid">
            {statCards.map((c, i) => (
              <div className="cards" key={c.id}>
                <div><i className={`fa-solid ${c.icon}`} /></div>
                <p>{c.label}</p>
                <h1 style={c.color ? { color: c.color } : {}}>
                  {data ? (c.value ?? '—') : '—'}
                </h1>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-container">
            <div className="chart-card">
              <h3>Income vs Expenses <span style={{ fontSize: '0.8rem', color: 'gray' }}>(Current Year)</span></h3>
              <div style={{ height: '300px' }}>
                {monthly.length > 0 && <Bar data={barData} options={barOptions} />}
              </div>
            </div>
            <div className="chart-card">
              <h3>Plan Distribution</h3>
              <div style={{ height: '300px' }}>
                {planDist.length > 0 && <Doughnut data={donutData} options={donutOptions} />}
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="payments-container">
            <h3>Recent Payments</h3>
            <table className="table-container" id="recentTable">
              <thead>
                <tr>
                  <th>Member</th><th>Plan</th><th>Amount</th><th>Mode</th><th>Date</th>
                </tr>
                <tr><td colSpan="5"><hr /></td></tr>
              </thead>
              <tbody>
                {!data ? (
                  <tr><td colSpan="5" className="empty-state">
                    <i className="fa-solid fa-spinner fa-spin" /> Loading…
                  </td></tr>
                ) : recentPayments.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">
                    <i className="fa-solid fa-receipt" /><br />No payments yet
                  </td></tr>
                ) : recentPayments.map((p, i) => (
                  <tr key={i}>
                    <td>{p.fullName}</td>
                    <td>{p.planName}</td>
                    <td style={{ color: '#278727', fontWeight: 700 }}>{fmt(p.amount)}</td>
                    <td>{p.paymentMode}</td>
                    <td>{p.paymentDate?.split('T')[0] ?? p.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
