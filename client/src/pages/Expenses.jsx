import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

export default function Expenses() {
  const { toast, showToast } = useToast();
  const [expenses,     setExpenses]     = useState([]);
  const [totalExp,     setTotalExp]     = useState(0);
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState({ type:'', amount:'', expenseDate:'', notes:'' });
  const [submitting,   setSubmitting]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    const [er, tr] = await Promise.all([
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/expenses?total=1').then(r => r.json()),
    ]);
    setExpenses(er);
    setTotalExp(tr.total || 0);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function openModal() {
    setForm({ type:'', amount:'', expenseDate: new Date().toISOString().split('T')[0], notes:'' });
    setModal(true);
  }

  async function submit() {
    if (!form.type) { showToast('Please select a type.', 'error'); return; }
    if (!form.amount || form.amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }
    if (!form.expenseDate) { showToast('Date is required.', 'error'); return; }
    setSubmitting(true);
    const res  = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) { setModal(false); showToast('Expense added!'); load(); }
    else showToast(data.error || 'Failed to add expense.', 'error');
  }

  async function doDelete() {
    const res  = await fetch(`/api/expenses/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleteTarget(null);
    if (data.success) { showToast('Expense deleted.'); load(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  return (
    <>
      <Toast toast={toast} />
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Expense?"
          message="This expense record will be permanently removed."
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
            <h2>Add Expense</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={form.type} onChange={onChange}>
                  <option value="">Select Type</option>
                  <option value="equipment">Equipment</option>
                  <option value="salary">Salary</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₱) *</label>
                <input type="number" name="amount" value={form.amount}
                  onChange={onChange} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="expenseDate" value={form.expenseDate} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={onChange}
                placeholder="Describe the expense…" />
            </div>
            <div style={{ background:'#fff8f0', borderRadius:'0.5rem', padding:'0.8rem 1rem',
              marginTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.85rem', color:'gray' }}>Amount to Record</span>
              <strong style={{ color:'orange', fontSize:'1rem' }}>
                {fmt(parseFloat(form.amount) || 0)}
              </strong>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="expenses">
        <div className="expense-wrapper">
          <div className="expense-left">
            <h1>Expenses</h1>
            <p>Track gym expenses and spending</p>
          </div>
          <div className="expense-right">
            <div className="expense">
              <p>Total Expenses</p>
              <h3>{fmt(totalExp)}</h3>
            </div>
            <div className="add-expense">
              <button onClick={openModal}>
                <span><i className="fa-solid fa-plus" /></span> Add Expense
              </button>
            </div>
          </div>
        </div>

        <div className="expense-table">
          {/* Desktop Table */}
          <table className="expense-container">
            <thead>
              <tr><th>Type</th><th>Amount</th><th>Date</th><th>Notes</th><th>Actions</th></tr>
              <tr><td colSpan="5"><hr /></td></tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">
                  <i className="fa-solid fa-file-invoice-dollar" /><br />No expenses recorded
                </td></tr>
              ) : expenses.map(e => (
                <tr key={e.expenses_id}>
                  <td style={{ textTransform:'capitalize' }}>{e.type}</td>
                  <td style={{ color:'orange', fontWeight:700 }}>{fmt(e.amount)}</td>
                  <td>{e.expenseDate?.split('T')[0] ?? e.expenseDate}</td>
                  <td>{e.notes || '—'}</td>
                  <td>
                    <button onClick={() => setDeleteTarget(e.expenses_id)} title="Delete">
                      <i className="fa-solid fa-delete-left" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {expenses.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-file-invoice-dollar" /><br />No expenses recorded
              </div>
            ) : expenses.map(e => (
              <div className="mobile-card" key={e.expenses_id}>
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-name" style={{ textTransform:'capitalize' }}>{e.type}</div>
                    <div className="mobile-card-sub">{e.expenseDate?.split('T')[0] ?? e.expenseDate}</div>
                  </div>
                  <strong style={{ color:'orange' }}>{fmt(e.amount)}</strong>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Notes</span>
                  <span className="mobile-card-value">{e.notes || '—'}</span>
                </div>
                <div className="mobile-card-actions">
                  <button onClick={() => setDeleteTarget(e.expenses_id)}>
                    <i className="fa-solid fa-delete-left" /> Delete
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
