import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@leadflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  const quickLogin = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <div className="login-card">
          <div className="login-logo">
            <div className="brand-icon" style={{ margin: '0 auto 10px' }}>LF</div>
            <div className="login-logo-name">LeadFlow CRM</div>
            <div className="login-logo-sub">Sales intelligence platform v2.0</div>
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Demo Accounts</div>
            {[
              { label: 'Admin', email: 'admin@leadflow.com', pass: 'admin123', color: '#f87171' },
              { label: 'Manager', email: 'manager@leadflow.com', pass: 'manager123', color: '#fbbf24' },
              { label: 'Sales Rep', email: 'rep@leadflow.com', pass: 'rep123', color: '#22d3a0' },
            ].map(acc => (
              <div
                key={acc.email}
                onClick={() => quickLogin(acc.email, acc.pass)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: acc.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 12, color: acc.color }}>{acc.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{acc.email}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text3)' }}>
          Built by <strong style={{ color: 'var(--text2)' }}>Janhavi Chaturvedi</strong>
        </div>
      </div>
    </div>
  );
}
