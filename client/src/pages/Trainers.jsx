import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = { fullName:'', phone:'', specialization:'' };

export default function Trainers() {
  const { toast, showToast } = useToast();
  const [trainers,     setTrainers]     = useState([]);
  const [modal,        setModal]        = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [submitting,   setSubmitting]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadTrainers() {
    const res = await fetch('/api/trainers');
    setTrainers(await res.json());
  }

  useEffect(() => { loadTrainers(); }, []);

  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function openModal() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEditModal(trainer) {
    setEditTarget(trainer);
    setForm({
      fullName:       trainer.fullName,
      phone:          trainer.phone || '',
      specialization: trainer.specialization || '',
    });
    setModal(true);
  }

  async function submit() {
    if (!form.fullName) { showToast('Name is required.', 'error'); return; }
    setSubmitting(true);

    const isEdit = !!editTarget;
    const url    = isEdit ? `/api/trainers/${editTarget.trainer_id}` : '/api/trainers';
    const method = isEdit ? 'PUT' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) { setModal(false); showToast(isEdit ? 'Trainer updated!' : 'Trainer added!'); loadTrainers(); }
    else showToast(data.error || 'Failed to save trainer.', 'error');
  }

  async function doDelete() {
    const res  = await fetch(`/api/trainers/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleteTarget(null);
    if (data.success) { showToast('Trainer removed.'); loadTrainers(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  return (
    <>
      <Toast toast={toast} />
      {deleteTarget && (
        <ConfirmDialog
          title="Remove Trainer?"
          message="The trainer will be deactivated and unassigned from members."
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
            <h2>{editTarget ? 'Edit Trainer' : 'Add Trainer'}</h2>
            <div className="form-group">
              <label>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={onChange}
                placeholder="e.g. Marcus Rivera" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={onChange}
                placeholder="09XXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input name="specialization" value={form.specialization} onChange={onChange}
                placeholder="e.g. Strength Training, Yoga, Cardio…" />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={submit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : (editTarget ? 'Save Changes' : 'Add Trainer')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="trainers">
        <div className="trainers-top">
          <div className="trainers-left">
            <h1>Trainers</h1>
            <p>Manage fitness trainers and assignments</p>
          </div>
          <div className="trainers-right">
            <button onClick={openModal}>
              <span><i className="fa-solid fa-plus" /></span> Add Trainer
            </button>
          </div>
        </div>
        <div className="trainers-bottom">
          <div className="trainers-grid">
            {trainers.length === 0 ? (
              <div className="empty-state" style={{ gridColumn:'1/-1' }}>
                <i className="fa-solid fa-dumbbell" /><br />No trainers yet. Add one!
              </div>
            ) : trainers.map(t => (
              <div className="trainers-cards" key={t.trainer_id}>
                <div className="trainers-status">
                  <i className="fa-solid fa-dumbbell" />
                  <p style={{ color:'var(--third)' }}>active</p>
                </div>
                <h3>{t.fullName}</h3>
                <p className="training">{t.specialization || 'General Training'}</p>
                <p className="phone">
                  <span><i className="fa-solid fa-phone" /></span> {t.phone || 'N/A'}
                </p>
                <p className="member">
                  <span><i className="fa-solid fa-user-group" /></span>{' '}
                  {t.memberCount} member{t.memberCount != 1 ? 's' : ''} assigned
                </p>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.25rem' }}>
                  <button
                    onClick={() => openEditModal(t)}
                    style={{ background:'none', border:'none', color:'#1d7ed6', fontSize:'0.85rem',
                      cursor:'pointer', padding:'0.3rem 0.5rem', borderRadius:'0.3rem',
                      transition:'0.2s', display:'flex', alignItems:'center', gap:'0.3rem' }}
                    onMouseEnter={e => e.currentTarget.style.background='#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                  >
                    <i className="fa-solid fa-pen-to-square" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t.trainer_id)}
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