import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function doLogin() {
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('ft_user', data.username);
        sessionStorage.setItem('ft_role', data.role);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Could not connect to server. Make sure it is running.');
    }
    setLoading(false);
  }

  function onKey(e) { if (e.key === 'Enter') doLogin(); }

  return (
    <main className="login-page">
      <div className="right">
        <i className="fa-solid fa-dumbbell" />
        <h1>JPrime <span>FitTrack</span></h1>
        <p>Gym Management System — Manage members, track attendance, and streamline operations.</p>
      </div>
      <div className="left">
        <div className="welcome">
          <h3>Welcome Back</h3>
          <p>Sign in to your account to continue</p>
        </div>
        <div className="form-container">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={onKey}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
          />
          {error && (
            <div className="error-msg" style={{ color:'#e53e3e', fontSize:'0.85rem' }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
            </div>
          )}
          <button
            className="sign-in"
            onClick={doLogin}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </main>
  );
}
