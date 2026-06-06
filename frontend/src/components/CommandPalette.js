import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function CommandPalette({ onClose, navigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/leads?search=${encodeURIComponent(query)}&limit=8`);
        setResults(r.data.leads || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const go = (lead) => {
    navigate(`/leads/${lead._id}`);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) go(results[selected]);
  };

  const statusColors = { New: '#22d3a0', Contacted: '#fbbf24', Qualified: '#9d98ff', Converted: '#22d3a0', Lost: '#f87171' };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <span style={{ padding: '0 16px', color: 'var(--text3)', fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            className="cmd-input"
            style={{ borderBottom: 'none' }}
            placeholder="Search leads by name, email, company..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
          />
          {loading && <span style={{ padding: '0 14px', color: 'var(--text3)', fontSize: 12 }}>...</span>}
        </div>

        <div className="cmd-results">
          {results.length === 0 && query && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No leads found for "{query}"
            </div>
          )}
          {results.length === 0 && !query && (
            <div style={{ padding: '20px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Quick Actions</div>
              {[
                { icon: '＋', label: 'Add new lead', hint: 'Go to leads page', action: () => { navigate('/leads'); onClose(); } },
                { icon: '◈', label: 'Dashboard', hint: 'View analytics', action: () => { navigate('/dashboard'); onClose(); } },
                { icon: '⊞', label: 'Kanban board', hint: 'Drag & drop view', action: () => { navigate('/kanban'); onClose(); } },
              ].map((item, i) => (
                <div key={i} className={`cmd-item ${selected === i ? 'selected' : ''}`} onClick={item.action}>
                  <span style={{ fontSize: 18, color: 'var(--accent)' }}>{item.icon}</span>
                  <div>
                    <div className="cmd-item-title">{item.label}</div>
                    <div className="cmd-item-sub">{item.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.map((lead, i) => (
            <div key={lead._id} className={`cmd-item ${selected === i ? 'selected' : ''}`} onClick={() => go(lead)}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                fontFamily: 'Syne,sans-serif'
              }}>
                {lead.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div className="cmd-item-title">{lead.name}</div>
                <div className="cmd-item-sub">{lead.company} · {lead.email}</div>
              </div>
              <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
            </div>
          ))}
        </div>

        <div className="cmd-footer">
          <span><span className="cmd-key">↑↓</span> navigate</span>
          <span><span className="cmd-key">↵</span> open</span>
          <span><span className="cmd-key">Esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
