// In-memory store - used when no MongoDB URI is provided
const { v4: uuidv4 } = require('uuid');

const store = {
  users: [],
  leads: [],
  activities: [],
  notifications: []
};

module.exports = function seedMemory() {
  // Seed users
  const bcrypt = require('bcryptjs');
  const salt = bcrypt.genSaltSync(10);

  store.users = [
    {
      _id: 'user-admin-1',
      name: 'Admin User',
      email: 'admin@leadflow.com',
      password: bcrypt.hashSync('admin123', salt),
      role: 'admin',
      avatar: 'AU',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: 'user-rep-1',
      name: 'Sales Rep',
      email: 'rep@leadflow.com',
      password: bcrypt.hashSync('rep123', salt),
      role: 'sales_rep',
      avatar: 'SR',
      createdAt: new Date('2024-01-15')
    },
    {
      _id: 'user-mgr-1',
      name: 'Sales Manager',
      email: 'manager@leadflow.com',
      password: bcrypt.hashSync('manager123', salt),
      role: 'manager',
      avatar: 'SM',
      createdAt: new Date('2024-01-10')
    }
  ];

  // Seed leads
  const now = new Date();
  const day = (n) => new Date(now - n * 86400000);

  store.leads = [
    {
      _id: uuidv4(), name: 'Priya Sharma', email: 'priya@techcorp.in', phone: '+91 98765 43210',
      company: 'TechCorp India', status: 'Qualified', source: 'Website',
      dealValue: 125000, notes: 'Very interested in enterprise plan. Follow up after demo.',
      assignedTo: 'user-rep-1', aiScore: 87, priority: 'High',
      followUpDate: day(-2), tags: ['enterprise', 'hot'],
      createdAt: day(10), updatedAt: day(2)
    },
    {
      _id: uuidv4(), name: 'Arjun Mehta', email: 'arjun@startupxyz.com', phone: '+91 87654 32109',
      company: 'StartupXYZ', status: 'Contacted', source: 'LinkedIn',
      dealValue: 45000, notes: 'Spoke briefly. Needs more info on pricing.',
      assignedTo: 'user-rep-1', aiScore: 62, priority: 'Medium',
      followUpDate: day(-1), tags: ['startup', 'warm'],
      createdAt: day(7), updatedAt: day(1)
    },
    {
      _id: uuidv4(), name: 'Neha Gupta', email: 'neha@globalsolutions.co', phone: '+91 76543 21098',
      company: 'Global Solutions', status: 'Converted', source: 'Referral',
      dealValue: 280000, notes: 'Closed! Annual contract signed.',
      assignedTo: 'user-mgr-1', aiScore: 95, priority: 'High',
      followUpDate: null, tags: ['enterprise', 'closed-won'],
      createdAt: day(20), updatedAt: day(0)
    },
    {
      _id: uuidv4(), name: 'Vikram Singh', email: 'vikram@manufacturing.in', phone: '+91 65432 10987',
      company: 'Singh Manufacturing', status: 'New', source: 'Cold Email',
      dealValue: 75000, notes: 'Initial contact made. Waiting for response.',
      assignedTo: 'user-rep-1', aiScore: 41, priority: 'Low',
      followUpDate: day(-3), tags: ['manufacturing'],
      createdAt: day(3), updatedAt: day(3)
    },
    {
      _id: uuidv4(), name: 'Kavya Reddy', email: 'kavya@fintech.io', phone: '+91 54321 09876',
      company: 'FinTech Solutions', status: 'Lost', source: 'Trade Show',
      dealValue: 60000, notes: 'Went with competitor. Budget constraints.',
      assignedTo: 'user-rep-1', aiScore: 28, priority: 'Low',
      followUpDate: null, tags: ['fintech', 'closed-lost'],
      createdAt: day(15), updatedAt: day(5)
    },
    {
      _id: uuidv4(), name: 'Rohit Kumar', email: 'rohit@ecommerce.biz', phone: '+91 43210 98765',
      company: 'EcomBiz India', status: 'New', source: 'Website',
      dealValue: 95000, notes: 'Filled out contact form. Interested in API integration.',
      assignedTo: 'user-mgr-1', aiScore: 73, priority: 'Medium',
      followUpDate: day(-1), tags: ['ecommerce'],
      createdAt: day(1), updatedAt: day(1)
    }
  ];

  // Seed activities
  store.activities = [
    { _id: uuidv4(), leadId: store.leads[0]._id, userId: 'user-rep-1', type: 'status_change', description: 'Status changed from Contacted to Qualified', createdAt: day(2) },
    { _id: uuidv4(), leadId: store.leads[0]._id, userId: 'user-rep-1', type: 'note_added', description: 'Added note: Very interested in enterprise plan', createdAt: day(4) },
    { _id: uuidv4(), leadId: store.leads[2]._id, userId: 'user-mgr-1', type: 'status_change', description: 'Status changed from Qualified to Converted', createdAt: day(0) },
    { _id: uuidv4(), leadId: store.leads[1]._id, userId: 'user-rep-1', type: 'email_sent', description: 'Follow-up email sent with pricing details', createdAt: day(1) },
  ];

  console.log(`📦 Seeded ${store.users.length} users, ${store.leads.length} leads`);
};

module.exports.store = store;
