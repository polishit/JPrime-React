import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';

const EMPTY_FORM = { member_id:'', plan_id:'', amount:'', paymentMode:'Cash', paymentDate:'', remarks:'' };

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

export default function Payments() {
  const { toast, showToast } = useToast();
  const [payments,    setPayments]    = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [members,     setMembers]     = useState([]);
  const [plans,       setPlans]       = useState([]);
  const [planPrices,  setPlanPrices]  = useState({});
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);

  async function loadDropdowns() {
    const [mr, pr] = await Promise.all([
      fetch('/api/members?search=&status=active').then(r => r.json()),
      fetch('/api/plans').then(r => r.json()),
    ]);
    setMembers(mr);
    setPlans(pr);
    const pp = {};
    pr.forEach(p => { pp[p.plan_id] = p.price; });
    setPlanPrices(pp);
  }

  async function loadPayments() {
    const [pr, tr] = await Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/payments?total=1').then(r => r.json()),
    ]);
    setPayments(pr);
    setTotalIncome(tr.total || 0);
  }

  useEffect(() => {
    loadDropdowns();
    loadPayments();
    const interval = setInterval(loadPayments, 20000);
    return () => clearInterval(interval);
  }, []);

  function onChange(e) {
    const next = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'plan_id' && planPrices[e.target.value]) {
      next.amount = planPrices[e.target.value];
    }
    setForm(next);
  }

  function openModal() {
    setForm({ ...EMPTY_FORM, paymentDate: new Date().toISOString().split('T')[0] });
    setModal(true);
  }

  async function submit() {
    if (!form.member_id) { showToast('Please select a member.', 'error'); return; }
    if (!form.amount || form.amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }
    if (!form.paymentDate) { showToast('Payment date is required.', 'error'); return; }
    setSubmitting(true);
    const res  = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setModal(false);
      showToast('Payment recorded!');
      loadPayments();
    } else {
      showToast(data.error || 'Failed to record payment.', 'error');
    }
  }

  return (
    <>
      <Toast toast={toast} />

      {modal && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <button className="modal-close" onClick={() => setModal(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
            <h2>Record Payment</h2>
            <div className="form-group">
              <label>Member *</label>
              <select name="member_id" value={form.member_id} onChange={onChange}>
                <option value="">Select Member</option>
                {members.map(m => <option key={m.member_id} value={m.member_id}>{m.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Plan *</label>
              <select name="plan_id" value={form.plan_id} onChange={onChange}>
                <option value="">Select Plan</option>
                {plans.map(p => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.name} – ₱{Number(p.price).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount (₱) *</label>
                <input type="number" name="amount" value={form.amount}
                  onChange={onChange} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Payment Mode *</label>
                <select name="paymentMode" value={form.paymentMode} onChange={onChange}>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI / GCash</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Date *</label>
                <input type="date" name="paymentDate" value={form.paymentDate} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input name="remarks" value={form.remarks} onChange={onChange} placeholder="e.g. Monthly renewal" />
              </div>
            </div>
            <div style={{ background:'#f9f9f9', borderRadius:'0.5rem', padding:'0.8rem 1rem',
              marginTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.85rem', color:'gray' }}>Amount to Record</span>
              <strong style={{ color:'#278727', fontSize:'1rem' }}>
                {fmt(parseFloat(form.amount) || 0)}
              </strong>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="payments">
        <div className="payments-wrapper">
          <div className="payments-left">
            <h1>Payments</h1>
            <p>Track membership payments</p>
          </div>
          <div className="payments-right">
            <div className="income">
              <p>Total Income</p>
              <h3>{fmt(totalIncome)}</h3>
            </div>
            <div className="record">
              <button onClick={openModal}>
                <span><i className="fa-solid fa-plus" /></span> Record Payment
              </button>
            </div>
          </div>
        </div>

        <div className="pay-table">
          <table className="paytable-container">
            <thead>
              <tr>
                <th>Member</th><th>Plan</th><th>Amount</th><th>Mode</th><th>Date</th><th>Remarks</th>
              </tr>
              <tr><td colSpan="6"><hr /></td></tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">
                  <i className="fa-solid fa-receipt" /><br />No payments recorded
                </td></tr>
              ) : payments.map(p => (
                <tr key={p.payments_id}>
                  <td>{p.fullName}</td>
                  <td>{p.planName}</td>
                  <td style={{ color:'#278727', fontWeight:700 }}>{fmt(p.amount)}</td>
                  <td>{p.paymentMode}</td>
                  <td>{p.paymentDate?.split('T')[0] ?? p.paymentDate}</td>
                  <td>{p.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
