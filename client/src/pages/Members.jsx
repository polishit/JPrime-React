import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = {
  fullName:'', gender:'', dob:'', phone:'', email:'',
  address:'', plan_id:'', trainer_id:'', joinDate:'', status:'active',
};

export default function Members() {
  const { toast, showToast } = useToast();
  const [members,     setMembers]     = useState([]);
  const [plans,       setPlans]       = useState([]);
  const [trainers,    setTrainers]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [modal,       setModal]       = useState(false);
  const [isEdit,      setIsEdit]      = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);

  async function loadDropdowns() {
    const [pr, tr] = await Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/trainers').then(r => r.json()),
    ]);
    setPlans(pr);
    setTrainers(tr);
  }

  async function loadMembers() {
    const res = await fetch(`/api/members?search=${encodeURIComponent(search)}&status=${statusFilter}`);
    setMembers(await res.json());
  }

  useEffect(() => { loadDropdowns(); }, []);
  useEffect(() => { loadMembers(); }, [search, statusFilter]);

  function openAdd() {
    setIsEdit(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM, joinDate: new Date().toISOString().split('T')[0] });
    setModal(true);
  }

  async function openEdit(member) {
    setIsEdit(true);
    setEditId(member.member_id);
    setForm({
      fullName:   member.fullName  || '',
      gender:     member.gender    || '',
      dob:        member.dob       || '',
      phone:      member.phone     || '',
      email:      member.email     || '',
      address:    member.address   || '',
      plan_id:    member.plan_id   || '',
      trainer_id: '',
      joinDate:   member.joinDate  || '',
      status:     member.status    || 'active',
    });
    setModal(true);
  }

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit() {
    if (!form.fullName) { showToast('Full name is required.', 'error'); return; }
    if (!form.joinDate) { showToast('Start date is required.', 'error'); return; }
    setSubmitting(true);
    const method = isEdit ? 'PUT' : 'POST';
    const url    = isEdit ? `/api/members/${editId}` : '/api/members';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setModal(false);
      showToast(isEdit ? 'Member updated!' : 'Member added!');
      loadMembers();
    } else {
      showToast(data.error || 'Something went wrong.', 'error');
    }
  }

  async function doDelete() {
    const res  = await fetch(`/api/members/${deleteTarget}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleteTarget(null);
    if (data.success) { showToast('Member deleted.'); loadMembers(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  return (
    <>
      <Toast toast={toast} />
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Member?"
          message="This will permanently remove the member and all related data."
          onConfirm={doDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <button className="modal-close" onClick={() => setModal(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
            <h2>{isEdit ? 'Edit Member' : 'Add Member'}</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={onChange} placeholder="e.g. Juan Dela Cruz" />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={onChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="09XXXXXXXXX" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange} placeholder="juan@email.com" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={onChange} placeholder="Street, City, Province" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Plan</label>
                <select name="plan_id" value={form.plan_id} onChange={onChange}>
                  <option value="">Select Plan</option>
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.name} ({p.durationMonths}mo – ₱{Number(p.price).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Trainer</label>
                <select name="trainer_id" value={form.trainer_id} onChange={onChange}>
                  <option value="">No Trainer</option>
                  {trainers.map(t => (
                    <option key={t.trainer_id} value={t.trainer_id}>
                      {t.fullName}{t.specialization ? ' – ' + t.specialization : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" name="joinDate" value={form.joinDate} onChange={onChange} />
              </div>
              {isEdit && (
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={onChange}>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={submit} disabled={submitting}>
                {submitting
                  ? <span className="spinner" />
                  : isEdit ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="members-dashboard">
        <div className="members-intro">
          <div className="members-left">
            <h1>Members</h1>
            <p>Manage gym members and their memberships</p>
          </div>
          <div className="members-right">
            <button onClick={openAdd}>
              <span><i className="fa-solid fa-plus" /></span> Add Member
            </button>
          </div>
        </div>

        <div className="members-search">
          <div className="search-members">
            <span><i className="fa-solid fa-magnifying-glass" /></span>
            <input
              type="search"
              placeholder="Search Members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="status-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding:'0.6rem 0.8rem', border:'1px solid rgba(128,128,128,0.3)',
              borderRadius:'var(--space-3)', fontFamily:"'Poppins',sans-serif",
              fontSize:'0.875rem', cursor:'pointer', outline:'none' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>

        <div className="members-table">
          <table className="members-table-container">
            <thead>
              <tr>
                <th>Name</th><th>Contact</th><th>Plan</th>
                <th>Trainer</th><th>Expiry</th><th>Status</th><th>Actions</th>
              </tr>
              <tr><td colSpan="7"><hr /></td></tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <i className="fa-solid fa-users-slash" /><br />No members found
                </td></tr>
              ) : members.map(m => (
                <tr key={m.member_id}>
                  <td>
                    <div>{m.fullName}</div>
                    <div>{m.gender || ''}</div>
                  </td>
                  <td>
                    <div>{m.email || '—'}</div>
                    <div>{m.phone || '—'}</div>
                  </td>
                  <td>{m.planName || '—'}</td>
                  <td>{m.trainerNames || '—'}</td>
                  <td>{m.expiryDate?.split('T')[0] ?? m.expiryDate}</td>
                  <td>
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                  </td>
                  <td>
                    <div className="actions-wrapper">
                      <button onClick={() => openEdit(m)} title="Edit">
                        <i className="fa-solid fa-pen-to-square" />
                      </button>
                      <button onClick={() => setDeleteTarget(m.member_id)} title="Delete">
                        <i className="fa-solid fa-delete-left" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
