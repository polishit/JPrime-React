import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);

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
    if (e.target.name === 'plan_id' && planPrices[e.target.value] && !editTarget) {
      next.amount = planPrices[e.target.value];
    }
    setForm(next);
  }

  function openModal() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, paymentDate: new Date().toISOString().split('T')[0] });
    setModal(true);
  }

  function openEditModal(payment) {
    setEditTarget(payment);
    setForm({
      member_id:   payment.member_id,
      plan_id:     payment.plan_id || '',
      amount:      payment.amount,
      paymentMode: payment.paymentMode,
      paymentDate: payment.paymentDate?.split('T')[0] ?? payment.paymentDate,
      remarks:     payment.remarks || '',
    });
    setModal(true);
  }

  async function submit() {
    if (!form.member_id) { showToast('Please select a member.', 'error'); return; }
    if (!form.amount || form.amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }
    if (!form.paymentDate) { showToast('Payment date is required.', 'error'); return; }
    setSubmitting(true);

    const isEdit = !!editTarget;
    const url    = isEdit ? `/api/payments/${editTarget.payments_id}` : '/api/payments';
    const method = isEdit ? 'PUT' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setModal(false);
      showToast(isEdit ? 'Payment updated!' : 'Payment recorded!');
      loadPayments();
    } else {
      showToast(data.error || 'Failed to save payment.', 'error');
    }
  }

  async function doDelete() {
    const res  = await fetch(`/api/payments/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleteTarget(null);
    if (data.success) { showToast('Payment deleted.'); loadPayments(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  return (
    <>
      <Toast toast={toast} />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Payment?"
          message="This payment record will be permanently removed."
          onConfirm={doDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {modal && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <button className="modal-close" onClick={() => setModal(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
            <h2>{editTarget ? 'Edit Payment' : 'Record Payment'}</h2>
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
                {submitting ? <span className="spinner" /> : (editTarget ? 'Save Changes' : 'Record Payment')}
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
          {/* Desktop Table */}
          <table className="paytable-container">
            <thead>
              <tr>
                <th>Member</th><th>Plan</th><th>Amount</th><th>Mode</th><th>Date</th><th>Remarks</th><th>Actions</th>
              </tr>
              <tr><td colSpan="7"><hr /></td></tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <i className="fa-solid fa-receipt" /><br />No payments recorded
                </td></tr>
              ) : payments.map(p => (
                <tr key={p.payments_id}>
                  <td>{p.fullName}</td>
                  <td>{p.planName || '—'}</td>
                  <td style={{ color:'#278727', fontWeight:700 }}>{fmt(p.amount)}</td>
                  <td>{p.paymentMode}</td>
                  <td>{p.paymentDate?.split('T')[0] ?? p.paymentDate}</td>
                  <td>{p.remarks || '—'}</td>
                  <td style={{ whiteSpace:'nowrap' }}>
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit"
                      style={{ background:'none', border:'none', color:'#1d7ed6', cursor:'pointer',
                        padding:'0.3rem 0.4rem', borderRadius:'0.3rem', marginRight:'0.3rem', fontSize:'0.85rem' }}
                      onMouseEnter={e => e.currentTarget.style.background='#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p.payments_id)}
                      title="Delete"
                      style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer',
                        padding:'0.3rem 0.4rem', borderRadius:'0.3rem', fontSize:'0.85rem' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {payments.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-receipt" /><br />No payments recorded
              </div>
            ) : payments.map(p => (
              <div className="mobile-card" key={p.payments_id}>
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-name">{p.fullName}</div>
                    <div className="mobile-card-sub">{p.paymentDate?.split('T')[0] ?? p.paymentDate}</div>
                  </div>
                  <strong style={{ color:'#278727' }}>{fmt(p.amount)}</strong>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Plan</span>
                  <span className="mobile-card-value">{p.planName || '—'}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Mode</span>
                  <span className="mobile-card-value">{p.paymentMode}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Remarks</span>
                  <span className="mobile-card-value">{p.remarks || '—'}</span>
                </div>
                <div className="mobile-card-actions">
                  <button onClick={() => openEditModal(p)}>
                    <i className="fa-solid fa-pen-to-square" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(p.payments_id)} style={{ color:'#ef4444' }}>
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}