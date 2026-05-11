import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Plans() {
  const { toast, showToast } = useToast();
  const [plans,        setPlans]        = useState([]);
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState({ name:'', durationMonths:'', price:'', description:'' });
  const [submitting,   setSubmitting]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadPlans() {
    const res = await fetch('/api/plans');
    setPlans(await res.json());
  }

  useEffect(() => { loadPlans(); }, []);

  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function openModal() {
    setForm({ name:'', durationMonths:'', price:'', description:'' });
    setModal(true);
  }

  async function submit() {
    if (!form.name) { showToast('Plan name is required.', 'error'); return; }
    if (!form.durationMonths || parseInt(form.durationMonths) < 1)
      { showToast('Duration must be at least 1 month.', 'error'); return; }
    if (isNaN(form.price) || form.price < 0)
      { showToast('Enter a valid price.', 'error'); return; }
    setSubmitting(true);
    const res  = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        durationMonths: parseInt(form.durationMonths),
        price: parseFloat(form.price),
        description: form.description,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) { setModal(false); showToast('Plan added!'); loadPlans(); }
    else showToast(data.error || 'Failed to add plan.', 'error');
  }

  async function doDelete() {
    const res  = await fetch(`/api/plans/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleteTarget(null);
    if (data.success) { showToast('Plan removed.'); loadPlans(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  return (
    <>
      <Toast toast={toast} />
      {deleteTarget && (
        <ConfirmDialog
          title="Remove Plan?"
          message="This plan will be deactivated. Members already on it won't be affected."
          confirmLabel="Remove"
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
            <h2>Add Plan</h2>
            <div className="form-group">
              <label>Plan Name *</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Monthly Basic" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Duration (months) *</label>
                <input type="number" name="durationMonths" value={form.durationMonths}
                  onChange={onChange} placeholder="1" min="1" step="1" />
              </div>
              <div className="form-group">
                <label>Price (₱) *</label>
                <input type="number" name="price" value={form.price}
                  onChange={onChange} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={onChange}
                placeholder="Brief description of this plan…" />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Add Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="plans">
        <div className="plans-top">
          <div className="plans-left">
            <h1>Membership Plans</h1>
            <p>Manage pricing and plan options</p>
          </div>
          <div className="plans-right">
            <button onClick={openModal}>
              <span><i className="fa-solid fa-plus" /></span> Add Plan
            </button>
          </div>
        </div>
        <div className="plans-bottom">
          <div className="grid-wrapper">
            {plans.length === 0 ? (
              <div className="empty-state" style={{ gridColumn:'1/-1' }}>
                <i className="fa-solid fa-clipboard-list" /><br />No plans yet. Add one!
              </div>
            ) : plans.map(p => (
              <div className="plans-cards" key={p.plan_id}>
                <div><i className="fa-solid fa-clock" /></div>
                <h3>{p.name}</h3>
                <div style={{ fontSize:'var(--font-2xl)', fontWeight:700, color:'#121212' }}>
                  ₱{Number(p.price).toLocaleString('en-PH', { minimumFractionDigits:2 })}
                </div>
                <div style={{ fontSize:'var(--font-sm)', color:'gray' }}>
                  {p.durationMonths} month{p.durationMonths > 1 ? 's' : ''}
                </div>
                <p style={{ fontSize:'var(--font-sm)', color:'gray', flex:1 }}>
                  {p.description || 'No description'}
                </p>
                <div className="member-count">
                  <span><i className="fa-solid fa-user-group" /></span>
                  {p.memberCount} member{p.memberCount != 1 ? 's' : ''}
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.25rem' }}>
                  <button
                    onClick={() => setDeleteTarget(p.plan_id)}
                    style={{ background:'none', border:'none', color:'#ef4444', fontSize:'0.85rem',
                      cursor:'pointer', padding:'0.3rem 0.5rem', borderRadius:'0.3rem',
                      transition:'0.2s', display:'flex', alignItems:'center', gap:'0.3rem' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                  >
                    <i className="fa-solid fa-trash" /> Remove
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
