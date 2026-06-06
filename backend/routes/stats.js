const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

function getStore() { return require('../utils/seedMemory').store; }

router.get('/', auth, (req, res) => {
  const store = getStore();
  let leads = store.leads;
  if (req.user.role === 'sales_rep') leads = leads.filter(l => l.assignedTo === req.user.id);

  const total = leads.length;
  const byStatus = { New: 0, Contacted: 0, Qualified: 0, Converted: 0, Lost: 0 };
  const bySource = {};
  let totalValue = 0, convertedValue = 0;

  leads.forEach(l => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    totalValue += l.dealValue || 0;
    if (l.status === 'Converted') convertedValue += l.dealValue || 0;
  });

  const conversionRate = total > 0 ? ((byStatus.Converted / total) * 100).toFixed(1) : 0;
  const avgDealValue = total > 0 ? Math.round(totalValue / total) : 0;

  // Monthly trend (last 6 months)
  const now = new Date();
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleString('default', { month: 'short' });
    const count = leads.filter(l => {
      const c = new Date(l.createdAt);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    monthlyTrend.push({ month, count });
  }

  // Due today/overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const dueToday = leads.filter(l => {
    if (!l.followUpDate) return false;
    const d = new Date(l.followUpDate);
    return d >= today && d < tomorrow;
  }).length;

  const overdue = leads.filter(l => {
    if (!l.followUpDate) return false;
    return new Date(l.followUpDate) < today && !['Converted', 'Lost'].includes(l.status);
  }).length;

  // AI score distribution
  const highPriority = leads.filter(l => (l.aiScore || 0) >= 75).length;
  const medPriority = leads.filter(l => (l.aiScore || 0) >= 45 && (l.aiScore || 0) < 75).length;
  const lowPriority = leads.filter(l => (l.aiScore || 0) < 45).length;

  res.json({
    total, byStatus, bySource, totalValue, convertedValue,
    conversionRate, avgDealValue, monthlyTrend,
    dueToday, overdue, highPriority, medPriority, lowPriority
  });
});

module.exports = router;
