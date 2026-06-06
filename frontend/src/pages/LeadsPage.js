import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import LeadModal from '../components/LeadModal';
import { formatDistanceToNow, format } from 'date-fns';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

function AiScore({ score }) {
  const cls = score >= 75 ? 'score-high' : score >= 45 ? 'score-med' : 'score-low';
  const color = score >= 75 ? 'var(--green)' : score >= 45 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div className={`ai-score ${cls}`}>
      <div className="ai-score-bar">
        <div className="ai-score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 700 }}>{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | lead object
  const [deleting, setDeleting] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();
  const LIMIT = 10;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT, sortBy, sortOrder,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const r = await api.get(`/leads?${params}`);
      setLeads(r.data.leads);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch { toast.error('Failed to load leads'); }
    setLoading(false);
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      fetchLeads();
    } catch { toast.error('Delete failed'); }
    setDeleting(null);
  };

  const handleSave = () => {
    setModal(null);
    toast.success(modal?._id ? 'Lead updated!' : 'Lead created!');
    fetchLeads();
  };

  const handleExport = async () => {
    try {
      const r = await api.get('/leads/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'leadflow-export.csv'; a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await api.post('/leads/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${r.data.imported} leads!`);
      fetchLeads();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  const sort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span style={{ color: 'var(--border2)' }}>↕</span>;
    return <span style={{ color: 'var(--accent)' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const isOverdue = (lead) => lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['Converted', 'Lost'].includes(lead.status);
  const isDueToday = (lead) => {
    if (!lead.followUpDate) return false;
    const d = new Date(lead.followUpDate); const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800 }}>Leads</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>{total} total leads</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>⬆ Import CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>⬇ Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Add Lead</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              placeholder="Search name, email, company..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            <button className={`filter-pill ${!statusFilter ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1); }}>All</button>
            {STATUSES.map(s => (
              <button key={s} className={`filter-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [f, o] = e.target.value.split(':'); setSortBy(f); setSortOrder(o); setPage(1); }} style={{ width: 'auto', padding: '7px 10px' }}>
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="aiScore:desc">AI Score ↓</option>
          <option value="dealValue:desc">Deal Value ↓</option>
          <option value="name:asc">Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div className="leads-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◉</div>
            <div className="empty-state-title">No leads found</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>Add your first lead</button>
            </div>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th onClick={() => sort('name')}>Lead <SortIcon field="name" /></th>
                <th>Contact</th>
                <th onClick={() => sort('status')}>Status <SortIcon field="status" /></th>
                <th onClick={() => sort('aiScore')}>AI Score <SortIcon field="aiScore" /></th>
                <th onClick={() => sort('dealValue')}>Deal Value <SortIcon field="dealValue" /></th>
                <th>Follow-up</th>
                <th onClick={() => sort('createdAt')}>Created <SortIcon field="createdAt" /></th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/leads/${lead._id}`)}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                        {lead.name[0]}
                      </div>
                      <div>
                        <div className="lead-name">{lead.name}</div>
                        <div className="lead-company">{lead.company}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="lead-email">{lead.email}</div>
                    {lead.phone && <div className="lead-email">{lead.phone}</div>}
                  </td>
                  <td><span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                  <td><AiScore score={lead.aiScore || 0} /></td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {lead.dealValue ? `₹${lead.dealValue.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td>
                    {lead.followUpDate ? (
                      <span className={isOverdue(lead) ? 'overdue' : isDueToday(lead) ? 'due-today' : ''} style={{ fontSize: 12 }}>
                        {isOverdue(lead) ? '⚠ ' : isDueToday(lead) ? '⏰ ' : ''}
                        {format(new Date(lead.followUpDate), 'dd MMM')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/leads/${lead._id}`)} title="View">👁</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(lead)} title="Edit">✏️</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(lead._id, lead.name)} disabled={deleting === lead._id} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
              return (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
            <button className="page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
              {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
          </div>
        )}
      </div>

      {modal && (
        <LeadModal
          lead={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
