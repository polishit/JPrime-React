import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';

export default function Attendance() {
  const { toast, showToast } = useToast();
  const [activeMembers,   setActiveMembers]   = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [selectedMember,  setSelectedMember]  = useState('');
  const [loading,         setLoading]         = useState(false);

  async function loadActiveMembers() {
    const res  = await fetch('/api/attendance?active_members=1');
    setActiveMembers(await res.json());
  }

  async function loadTodayAttendance() {
    const res  = await fetch('/api/attendance');
    setTodayAttendance(await res.json());
  }

  useEffect(() => {
    loadActiveMembers();
    loadTodayAttendance();
    const interval = setInterval(loadTodayAttendance, 15000);
    return () => clearInterval(interval);
  }, []);

  async function doCheckIn() {
    if (!selectedMember) { showToast('Please select a member.', 'error'); return; }
    setLoading(true);
    const res  = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: selectedMember }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      showToast('Check-in recorded!');
      setSelectedMember('');
      loadTodayAttendance();
    } else if (res.status === 409) {
      showToast('Member already checked in today.', 'error');
    } else {
      showToast(data.error || 'Check-in failed.', 'error');
    }
  }

  return (
    <>
      <Toast toast={toast} />
      <Sidebar />
      <main className="attendance">
        <div className="attendance-wrapper">
          <div className="attendance-welcome">
            <h1>Attendance</h1>
            <p>Record and track daily member check-ins</p>
          </div>

          {/* Quick Check-In */}
          <div className="checkin-wrapper">
            <h3>
              <span><i className="fa-solid fa-calendar-check" /></span> Quick Check-In
            </h3>
            <div className="checkin-select">
              <select
                className="checkin-left select-styled"
                value={selectedMember}
                onChange={e => setSelectedMember(e.target.value)}
                style={{ width:'100%', maxWidth:'24rem', padding:'0.6rem 1rem',
                  border:'1px solid rgba(128,128,128,0.3)', borderRadius:'var(--space-3)',
                  fontFamily:"'Poppins',sans-serif", fontSize:'0.875rem',
                  color:'#121212', cursor:'pointer', outline:'none', flex:1 }}
              >
                <option value="">
                  {activeMembers.length === 0 ? 'No active members' : 'Select Active Member…'}
                </option>
                {activeMembers.map(m => (
                  <option key={m.member_id} value={m.member_id}>{m.fullName}</option>
                ))}
              </select>
              <button className="checkin-right" onClick={doCheckIn} disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Checking in…</>
                  : <><span><i className="fa-solid fa-calendar-check" /></span> Check In</>}
              </button>
            </div>
          </div>

          {/* Today's Log */}
          <div className="checkin-table">
            <h3>
              Today's Check-In (<span>{todayAttendance.length}</span>)
            </h3>
            <div className="attendance-log" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {todayAttendance.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-calendar-xmark" /><br />No check-ins yet today
                </div>
              ) : todayAttendance.map(a => {
                const time = new Date(a.checkIn).toLocaleTimeString('en-PH',
                  { hour:'2-digit', minute:'2-digit' });
                return (
                  <div className="checkin-person" key={a.attendance_id}>
                    <p
                      className="person-initial"
                      style={{ background:'#ffa500', color:'white', fontWeight:700,
                        width:'2.5rem', height:'2.5rem', borderRadius:'50%',
                        display:'flex', justifyContent:'center', alignItems:'center', flexShrink:0 }}
                    >
                      {a.fullName.charAt(0).toUpperCase()}
                    </p>
                    <div className="person-details">
                      <p>{a.fullName}</p>
                      <p style={{ fontSize:'0.75rem', color:'gray' }}>
                        <span><i className="fa-solid fa-clock" /></span> {time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
