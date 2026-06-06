import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import LeadModal from '../components/LeadModal';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const STATUS_COLORS = { New: '#22d3a0', Contacted: '#fbbf24', Qualified: '#9d98ff', Converted: '#22d3ee', Lost: '#f87171' };

const ACTIVITY_ICONS = {
  created: '✦', status_change: '⟳', note_added: '✎', email_sent: '✉', updated: '✏'
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/leads/${id}`);
      setLead(r.data);
    } catch { toast.error('Lead not found'); navigate('/leads'); }
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, [id]);

  const handleStatusChange = async (status) => {
    if (status === lead.status) return;
    setStatusUpdating(true);
    try {
      const r = await api.patch(`/leads/${id}/status`, { status });
      setLead(prev => ({ ...prev, ...r.data }));
      toast.success(`Status → ${status}`);
      fetchLead();
    } catch { toast.error('Failed to update status'); }
    setStatusUpdating(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${lead.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      navigate('/leads');
    } catch { toast.error('Delete failed'); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/leads/${id}/note`, { note });
      toast.success('Note added');
      setNote('');
      fetchLead();
    } catch { toast.error('Failed to add note'); }
    setAddingNote(false);
  };

  if (loading) return <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 60 }}>Loading lead...</div>;
  if (!lead) return null;

  const statusIdx = STATUSES.indexOf(lead.status);
  const scoreColor = (lead.aiScore || 0) >= 75 ? '#22d3a0' : (lead.aiScore || 0) >= 45 ? '#fbbf24' : '#f87171';
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['Converted', 'Lost'].includes(lead.status);

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/leads')}>
        ← Back to Leads
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-avatar">{lead.name[0]}</div>
        <div className="detail-info">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div className="detail-name">{lead.name}</div>
              <div className="detail-company">{lead.company}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>AI Score</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: scoreColor }}>{lead.aiScore || '—'}</div>
                <div style={{ fontSize: 10, color: scoreColor }}>
                  {(lead.aiScore || 0) >= 75 ? '🔥 Hot' : (lead.aiScore || 0) >= 45 ? '⚡ Warm' : '❄️ Cold'}
                </div>
              </div>
              {lead.dealValue > 0 && (
                <div style={{ textAlign: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Deal Value</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--cyan)' }}>
                    ₹{lead.dealValue >= 100000 ? `${(lead.dealValue / 100000).toFixed(1)}L` : lead.dealValue.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-meta">
            <span className="meta-item">📧 <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent2)', textDecoration: 'none' }}>{lead.email}</a></span>
            {lead.phone && <span className="meta-item">📱 {lead.phone}</span>}
            {lead.source && <span className="meta-item">📌 {lead.source}</span>}
            <span className="meta-item">📅 Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
            {lead.followUpDate && (
              <span className={`meta-item ${isOverdue ? 'overdue' : ''}`}>
                {isOverdue ? '⚠' : '🗓'} Follow-up: {format(new Date(lead.followUpDate), 'dd MMM yyyy')}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
          </div>

          {lead.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {lead.tags.map(tag => (
                <span key={tag} style={{ background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 99, padding: '2px 8px', fontSize: 11, color: 'var(--text2)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏ Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Delete</button>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Pipeline Stage</div>
        <div className="pipeline">
          {STATUSES.map((s, i) => (
            <button
              key={s}
              className={`pipeline-step ${lead.status === s ? 'active' : i < statusIdx ? 'past' : ''}`}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating}
              style={lead.status === s ? { background: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: Notes + Add Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notes */}
          <div className="card">
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📝 Notes</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, minHeight: 60, whiteSpace: 'pre-wrap' }}>
              {lead.notes || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No notes yet.</span>}
            </div>
          </div>

          {/* Add Note */}
          <div className="card">
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Add Note</div>
            <textarea
              rows={3} placeholder="Write a note, call summary, or update..."
              value={note} onChange={e => setNote(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={addingNote || !note.trim()}>
              {addingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>

          {/* Contact Info */}
          <div className="card">
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Contact Info</div>
            {[
              { label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
              { label: 'Phone', value: lead.phone || '—' },
              { label: 'Company', value: lead.company },
              { label: 'Source', value: lead.source || '—' },
              { label: 'Priority', value: lead.priority || '—' },
              { label: 'Assigned To', value: lead.assignedUser?.name || '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text3)' }}>{item.label}</span>
                {item.href ? (
                  <a href={item.href} style={{ color: 'var(--accent2)', textDecoration: 'none' }}>{item.value}</a>
                ) : (
                  <span style={{ fontWeight: 500 }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Activity Timeline</div>
          {(!lead.activities || lead.activities.length === 0) ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No activity yet</div>
          ) : (
            <div className="activity-feed">
              {lead.activities.map(act => (
                <div key={act._id} className="activity-item">
                  <div className={`activity-dot ${act.type}`}>
                    <span style={{ fontSize: 12 }}>{ACTIVITY_ICONS[act.type] || '●'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="activity-text">{act.description}</div>
                    <div className="activity-time">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <LeadModal
          lead={lead}
          onClose={() => setEditing(false)}
          onSave={() => { setEditing(false); toast.success('Lead updated!'); fetchLead(); }}
        />
      )}
    </div>
  );
}
