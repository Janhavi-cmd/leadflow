import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../utils/api';

const STATUS_COLORS = {
  New: '#22d3a0', Contacted: '#fbbf24', Qualified: '#6c63ff', Converted: '#22d3ee', Lost: '#f87171'
};

const fmtCurrency = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 60 }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ color: 'var(--red)', padding: 20 }}>Failed to load stats. Make sure backend is running.</div>;

  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(stats.bySource || {}).map(([name, value]) => ({ name, value }));

  const kpiCards = [
    { label: 'Total Leads', value: stats.total, icon: '◉', sub: 'All time', color: '#6c63ff' },
    { label: 'Converted', value: stats.byStatus.Converted || 0, icon: '✓', sub: `${stats.conversionRate}% rate`, color: '#22d3a0' },
    { label: 'Revenue Closed', value: fmtCurrency(stats.convertedValue || 0), icon: '₹', sub: 'Total deal value', color: '#22d3ee' },
    { label: 'Avg Deal Value', value: fmtCurrency(stats.avgDealValue || 0), icon: '◈', sub: 'Per lead', color: '#fbbf24' },
    { label: 'Overdue', value: stats.overdue || 0, icon: '⚠', sub: `${stats.dueToday || 0} due today`, color: '#f87171' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Sales pipeline overview & analytics</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/leads')}>
          View All Leads →
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {kpiCards.map((k, i) => (
          <div key={i} className="stat-card" style={{ '--card-color': k.color }}>
            <div className="stat-label">{k.label}</div>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
            <div className="stat-sub">{k.sub}</div>
            <div className="stat-icon">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* AI Score Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="chart-title">Lead Trend (6 months)</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.monthlyTrend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Leads" stroke="#6c63ff" fill="url(#colorCount)" strokeWidth={2} dot={{ fill: '#6c63ff', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">Status Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6c63ff'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text2)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="chart-container">
          <div className="chart-title">Leads by Source</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads" fill="#6c63ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">AI Lead Score Distribution</div>
          <div style={{ padding: '12px 0' }}>
            {[
              { label: 'High Priority (75+)', count: stats.highPriority || 0, color: '#22d3a0', icon: '🔥' },
              { label: 'Medium Priority (45–74)', count: stats.medPriority || 0, color: '#fbbf24', icon: '⚡' },
              { label: 'Low Priority (<45)', count: stats.lowPriority || 0, color: '#f87171', icon: '❄️' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12 }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: item.color, borderRadius: 3,
                    width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            ))}
            <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>CONVERSION FUNNEL</div>
              {['New', 'Contacted', 'Qualified', 'Converted'].map((s, i, arr) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                  <span style={{ width: 80, fontSize: 11, color: 'var(--text2)' }}>{s}</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: STATUS_COLORS[s], borderRadius: 2,
                      width: stats.total > 0 ? `${((stats.byStatus[s] || 0) / stats.total) * 100}%` : '0%'
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right' }}>{stats.byStatus[s] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
