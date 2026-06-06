import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // Socket.io
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    s.on('lead:status_changed', (data) => {
      toast(`📊 ${data.leadName}: ${data.from} → ${data.to}`, { icon: '🔄' });
      setNotifications(prev => [{
        id: Date.now(), type: 'status', title: `${data.leadName} moved to ${data.to}`,
        time: new Date(), unread: true
      }, ...prev.slice(0, 19)]);
    });
    s.on('lead:created', (data) => {
      toast.success(`New lead: ${data.lead.name}`);
      setNotifications(prev => [{
        id: Date.now(), type: 'new', title: `New lead added: ${data.lead.name}`,
        time: new Date(), unread: true
      }, ...prev.slice(0, 19)]);
    });
    return () => s.disconnect();
  }, []);

  // Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const clearNotif = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const navItems = [
    { to: '/dashboard', icon: '◈', label: 'Dashboard' },
    { to: '/leads', icon: '◉', label: 'Leads' },
    { to: '/kanban', icon: '⊞', label: 'Kanban Board' },
  ];

  const roleColors = { admin: '#f87171', manager: '#fbbf24', sales_rep: '#22d3a0' };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">LF</div>
          {!collapsed && <span className="brand-name">LeadFlow</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
            title="Toggle sidebar"
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="nav-section">
          {!collapsed && <div className="nav-label">Navigation</div>}
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
          {!collapsed && <div className="nav-label" style={{ marginTop: 12 }}>Quick Actions</div>}
          <div
            className="nav-item"
            onClick={() => setCmdOpen(true)}
            title={collapsed ? 'Search (Ctrl+K)' : undefined}
          >
            <span className="nav-icon">⌘</span>
            {!collapsed && <span>Search (Ctrl+K)</span>}
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="avatar" style={{ background: roleColors[user?.role] || '#6c63ff' }}>
            {user?.avatar || user?.name?.[0]}
          </div>
          {!collapsed && (
            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-role" style={{ color: roleColors[user?.role] }}>{user?.role?.replace('_', ' ')}</div>
            </div>
          )}
          {!collapsed && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={logout}
              title="Logout"
            >↩</button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        <header className="top-header">
          <div style={{ flex: 1 }} />
          <NotificationBell notifications={notifications} onClear={clearNotif} />
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <div className="avatar avatar-sm">{user?.avatar}</div>
        </header>

        <main className="page-content animate-in">
          <Outlet />
        </main>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} navigate={navigate} />}
    </div>
  );
}
