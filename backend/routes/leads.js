const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Email', 'Trade Show', 'Other'];

function getStore() { return require('../utils/seedMemory').store; }

function computeAiScore(lead) {
  let score = 30;
  if (lead.dealValue > 200000) score += 25;
  else if (lead.dealValue > 100000) score += 18;
  else if (lead.dealValue > 50000) score += 10;
  if (lead.source === 'Referral') score += 20;
  else if (lead.source === 'LinkedIn') score += 12;
  else if (lead.source === 'Website') score += 8;
  if (lead.status === 'Qualified') score += 15;
  else if (lead.status === 'Contacted') score += 8;
  else if (lead.status === 'Converted') score += 20;
  else if (lead.status === 'Lost') score -= 20;
  if (lead.notes && lead.notes.length > 50) score += 5;
  if (lead.followUpDate) score += 5;
  return Math.max(5, Math.min(99, score));
}

function logActivity(store, leadId, userId, type, description) {
  store.activities.push({ _id: uuidv4(), leadId, userId, type, description, createdAt: new Date() });
}

function canAccessLead(user, lead) {
  if (user.role === 'admin' || user.role === 'manager') return true;
  return lead.assignedTo === user.id;
}

// GET /api/leads
router.get('/', auth, (req, res) => {
  const store = getStore();
  let leads = [...store.leads];

  // Role-based filtering
  if (req.user.role === 'sales_rep') {
    leads = leads.filter(l => l.assignedTo === req.user.id);
  }

  // Search
  const { search, status, source, priority, assignedTo, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

  if (search) {
    const q = search.toLowerCase();
    leads = leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
    );
  }
  if (status) leads = leads.filter(l => l.status === status);
  if (source) leads = leads.filter(l => l.source === source);
  if (priority) leads = leads.filter(l => l.priority === priority);
  if (assignedTo) leads = leads.filter(l => l.assignedTo === assignedTo);

  // Sort
  leads.sort((a, b) => {
    let av = a[sortBy], bv = b[sortBy];
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'followUpDate') {
      av = av ? new Date(av) : 0; bv = bv ? new Date(bv) : 0;
    }
    if (sortBy === 'dealValue' || sortBy === 'aiScore') { av = av || 0; bv = bv || 0; }
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const total = leads.length;
  const pageNum = parseInt(page), limitNum = parseInt(limit);
  const paginated = leads.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Enrich with user info
  const enriched = paginated.map(l => ({
    ...l,
    assignedUser: store.users.find(u => u._id === l.assignedTo)
      ? { name: store.users.find(u => u._id === l.assignedTo).name, avatar: store.users.find(u => u._id === l.assignedTo).avatar }
      : null
  }));

  res.json({ leads: enriched, total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum });
});

// GET /api/leads/export/csv  ← MUST be before /:id to avoid shadowing
router.get('/export/csv', auth, (req, res) => {
  const store = getStore();
  let leads = store.leads;
  if (req.user.role === 'sales_rep') leads = leads.filter(l => l.assignedTo === req.user.id);

  const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Deal Value', 'Priority', 'AI Score', 'Notes', 'Follow Up Date', 'Created At'];
  const rows = leads.map(l => [
    l.name, l.email, l.phone, l.company, l.status, l.source || '',
    l.dealValue || 0, l.priority || '', l.aiScore || '',
    (l.notes || '').replace(/,/g, ';'),
    l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
    new Date(l.createdAt).toLocaleDateString()
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leadflow-export.csv"');
  res.send(csv);
});

// POST /api/leads/import/csv  ← MUST be before /:id
router.post('/import/csv', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const store = getStore();
  const content = fs.readFileSync(req.file.path, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, ''));

  let imported = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });

    if (!row.name || !row.email || !row.company) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      continue;
    }

    const lead = {
      _id: uuidv4(), name: row.name, email: row.email, phone: row.phone || '',
      company: row.company, status: STATUSES.includes(row.status) ? row.status : 'New',
      source: SOURCES.includes(row.source) ? row.source : 'Other',
      dealValue: parseFloat(row.dealvalue || row['dealvalue'] || 0) || 0,
      notes: row.notes || '', priority: row.priority || 'Medium',
      tags: [], assignedTo: req.user.id,
      createdAt: new Date(), updatedAt: new Date()
    };
    lead.aiScore = computeAiScore(lead);
    store.leads.push(lead);
    imported++;
  }

  fs.unlinkSync(req.file.path);
  res.json({ message: `Imported ${imported} leads`, imported, errors });
});

// GET /api/leads/kanban
router.get('/kanban', auth, (req, res) => {
  const store = getStore();
  let leads = [...store.leads];
  if (req.user.role === 'sales_rep') leads = leads.filter(l => l.assignedTo === req.user.id);

  const board = {};
  STATUSES.forEach(s => { board[s] = []; });
  leads.forEach(l => { if (board[l.status]) board[l.status].push(l); });
  res.json(board);
});

// GET /api/leads/:id
router.get('/:id', auth, (req, res) => {
  const store = getStore();
  const lead = store.leads.find(l => l._id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!canAccessLead(req.user, lead)) return res.status(403).json({ error: 'Access denied' });
  const activities = store.activities.filter(a => a.leadId === lead._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const assignedUser = store.users.find(u => u._id === lead.assignedTo);
  res.json({ ...lead, activities, assignedUser: assignedUser ? { name: assignedUser.name, avatar: assignedUser.avatar, email: assignedUser.email } : null });
});

// POST /api/leads
router.post('/', auth, (req, res) => {
  const store = getStore();
  const { name, email, phone, company, status, source, dealValue, notes, followUpDate, priority, tags, assignedTo } = req.body;
  if (!name || !email || !company) return res.status(400).json({ error: 'Name, email, company required' });

  const lead = {
    _id: uuidv4(), name, email, phone: phone || '', company,
    status: STATUSES.includes(status) ? status : 'New',
    source: SOURCES.includes(source) ? source : 'Other',
    dealValue: parseFloat(dealValue) || 0,
    notes: notes || '', followUpDate: followUpDate ? new Date(followUpDate) : null,
    priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
    tags: Array.isArray(tags) ? tags : [],
    assignedTo: assignedTo || req.user.id,
    createdAt: new Date(), updatedAt: new Date()
  };
  lead.aiScore = computeAiScore(lead);
  store.leads.push(lead);
  logActivity(store, lead._id, req.user.id, 'created', `Lead created by ${req.user.name}`);
  if (req.io) req.io.emit('lead:created', { lead, createdBy: req.user.name });
  res.status(201).json(lead);
});

// PUT /api/leads/:id
router.put('/:id', auth, (req, res) => {
  const store = getStore();
  const idx = store.leads.findIndex(l => l._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  if (!canAccessLead(req.user, store.leads[idx])) return res.status(403).json({ error: 'Access denied' });

  const old = store.leads[idx];
  const { name, email, phone, company, status, source, dealValue, notes, followUpDate, priority, tags, assignedTo } = req.body;

  if (status && status !== old.status) {
    logActivity(store, old._id, req.user.id, 'status_change', `Status changed from ${old.status} to ${status}`);
    if (req.io) req.io.emit('lead:status_changed', { leadId: old._id, leadName: old.name, from: old.status, to: status, changedBy: req.user.name });
  }

  const updated = {
    ...old,
    name: name || old.name, email: email || old.email, phone: phone !== undefined ? phone : old.phone,
    company: company || old.company, status: STATUSES.includes(status) ? status : old.status,
    source: source || old.source, dealValue: dealValue !== undefined ? parseFloat(dealValue) : old.dealValue,
    notes: notes !== undefined ? notes : old.notes,
    followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : old.followUpDate,
    priority: priority || old.priority, tags: tags || old.tags,
    assignedTo: assignedTo || old.assignedTo,
    updatedAt: new Date()
  };
  updated.aiScore = computeAiScore(updated);
  store.leads[idx] = updated;
  logActivity(store, updated._id, req.user.id, 'updated', `Lead details updated by ${req.user.name}`);
  res.json(updated);
});

// PATCH /api/leads/:id/status
router.patch('/:id/status', auth, (req, res) => {
  const store = getStore();
  const idx = store.leads.findIndex(l => l._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const old = store.leads[idx];
  logActivity(store, old._id, req.user.id, 'status_change', `Status changed from ${old.status} to ${status}`);
  store.leads[idx] = { ...old, status, updatedAt: new Date() };
  store.leads[idx].aiScore = computeAiScore(store.leads[idx]);
  if (req.io) req.io.emit('lead:status_changed', { leadId: old._id, leadName: old.name, from: old.status, to: status, changedBy: req.user.name });
  res.json(store.leads[idx]);
});

// DELETE /api/leads/:id
router.delete('/:id', auth, (req, res) => {
  const store = getStore();
  const idx = store.leads.findIndex(l => l._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'sales_rep' && store.leads[idx].assignedTo !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const [deleted] = store.leads.splice(idx, 1);
  if (req.io) req.io.emit('lead:deleted', { leadId: deleted._id, leadName: deleted.name, deletedBy: req.user.name });
  res.json({ message: 'Lead deleted', id: deleted._id });
});

// POST /api/leads/:id/note
router.post('/:id/note', auth, (req, res) => {
  const store = getStore();
  const idx = store.leads.findIndex(l => l._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note required' });
  logActivity(store, req.params.id, req.user.id, 'note_added', `Note added: ${note.slice(0, 80)}`);
  store.leads[idx] = { ...store.leads[idx], notes: note, updatedAt: new Date() };
  res.json({ message: 'Note added', activity: store.activities[store.activities.length - 1] });
});

module.exports = router;
