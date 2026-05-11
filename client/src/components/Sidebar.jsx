import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const user = sessionStorage.getItem('ft_user') || 'admin';
  const role = sessionStorage.getItem('ft_role') || 'Admin';
  const [open, setOpen] = useState(false);

  function toggleSidebar() {
    setOpen(o => !o);
    document.body.style.overflow = !open ? 'hidden' : '';
  }

  function handleLogout() {
    sessionStorage.clear();
    navigate('/login');
  }

  const navItems = [
    { to: '/dashboard',  icon: 'fa-gauge',          label: 'Dashboard' },
    { to: '/members',    icon: 'fa-user-group',      label: 'Members' },
    { to: '/attendance', icon: 'fa-table',           label: 'Attendance' },
    { to: '/payments',   icon: 'fa-brands fa-paypal',label: 'Payments', brands: true },
    { to: '/expenses',   icon: 'fa-dollar-sign',     label: 'Expenses' },
    { to: '/plans',      icon: 'fa-clipboard-user',  label: 'Plans' },
    { to: '/trainers',   icon: 'fa-dumbbell',        label: 'Trainers' },
  ];

  const mobileItems = navItems.filter(n => n.to !== '/expenses');

  return (
    <>
      {/* Hamburger */}
      <button
        className={`hamburger${open ? ' open' : ''}`}
        id="hamburger"
        aria-label="Toggle menu"
        onClick={toggleSidebar}
      >
        <span /><span /><span />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="sidebar-overlay active"
          id="overlay"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav className={`side-bar${open ? ' open' : ''}`} id="sidebar">
        <div className="upper">
          <div className="upper-left"><i className="fa-solid fa-dumbbell" /></div>
          <div className="upper-right"><h2>JPrime</h2><p>FitTrack</p></div>
        </div>
        <hr />
        <div className="middle">
          <ul className="middle-list">
            {navItems.map(({ to, icon, label, brands }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={() => { setOpen(false); document.body.style.overflow = ''; }}
                >
                  <span><i className={`${brands ? '' : 'fa-solid '}fa-solid ${icon}`} /></span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="bottom">
          <div className="bottom-left">
            <div className="bottom-icon"><i className="fa-regular fa-user" /></div>
            <div className="bottom-admin">
              <p>{user}</p>
              <p>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
            </div>
          </div>
          <button
            className="bottom-right"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={handleLogout}
            title="Logout"
          >
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {mobileItems.map(({ to, icon, label, brands }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className={`fa-solid ${icon}`} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
