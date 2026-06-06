import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Email', 'Trade Show', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

// ── helpers defined OUTSIDE the component so React never remounts them ──
function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && ' *'}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{error}</span>}
    </div>
  );
}

function FieldFull({ label, error, children }) {
  return (
    <div className="form-group full">
      <label>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{error}</span>}
    </div>
  );
}

export default function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', status: 'New',
    source: 'Website', dealValue: '', priority: 'Medium',
    notes: '', followUpDate: '', assignedTo: '', tags: ''
  });
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // simple updater — avoids stale-closure issues
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (lead) {
      setForm({
        name:         lead.name        || '',
        email:        lead.email       || '',
        phone:        lead.phone       || '',
        company:      lead.company     || '',
        status:       lead.status      || 'New',
        source:       lead.source      || 'Website',
        dealValue:    lead.dealValue   || '',
        priority:     lead.priority    || 'Medium',
        notes:        lead.notes       || '',
        followUpDate: lead.followUpDate
                        ? new Date(lead.followUpDate).toISOString().slice(0, 10)
                        : '',
        assignedTo:   lead.assignedTo  || '',
        tags:         Array.isArray(lead.tags) ? lead.tags.join(', ') : ''
      });
    }
  }, [lead]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.company.trim()) e.company = 'Company is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        dealValue:    parseFloat(form.dealValue) || 0,
        tags:         form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        followUpDate: form.followUpDate || null,
      };
      const r = lead?._id
        ? await api.put(`/leads/${lead._id}`, payload)
        : await api.post('/leads', payload);
      onSave(r.data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to save' });
    }
    setSaving(false);
  };

  const inputStyle = (field) => errors[field] ? { borderColor: 'var(--red)' } : {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">{lead ? 'Edit Lead' : '+ Add New Lead'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {errors.submit && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: 'var(--red)', fontSize: 13
            }}>
              {errors.submit}
            </div>
          )}

          <div className="form-grid">

            {/* Full Name */}
            <Field label="Full Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                style={inputStyle('name')}
                placeholder="e.g. Priya Sharma"
                autoFocus
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" required error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                style={inputStyle('email')}
                placeholder="e.g. priya@company.com"
              />
            </Field>

            {/* Phone */}
            <Field label="Phone Number">
              <input
                type="text"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. +91 98765 43210"
              />
            </Field>

            {/* Company */}
            <Field label="Company Name" required error={errors.company}>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                style={inputStyle('company')}
                placeholder="e.g. TechCorp India"
              />
            </Field>

            {/* Lead Status */}
            <Field label="Lead Status">
              <select value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            {/* Lead Source */}
            <Field label="Lead Source">
              <select value={form.source} onChange={set('source')}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            {/* Deal Value */}
            <Field label="Deal Value (₹)">
              <input
                type="number"
                value={form.dealValue}
                onChange={set('dealValue')}
                placeholder="e.g. 50000"
                min="0"
              />
            </Field>

            {/* Priority */}
            <Field label="Priority">
              <select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>

            {/* Follow-up Date */}
            <Field label="Follow-up Date">
              <input
                type="date"
                value={form.followUpDate}
                onChange={set('followUpDate')}
              />
            </Field>

            {/* Assign To */}
            {users.length > 0 && (
              <Field label="Assign To">
                <select value={form.assignedTo} onChange={set('assignedTo')}>
                  <option value="">— Select user —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Tags */}
            <Field label="Tags (comma separated)">
              <input
                type="text"
                value={form.tags}
                onChange={set('tags')}
                placeholder="e.g. enterprise, hot, referral"
              />
            </Field>

            {/* Notes — full width */}
            <FieldFull label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                placeholder="Call summary, next steps, context..."
              />
            </FieldFull>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>

      </div>
    </div>
  );
}
