const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

function getStore() { return require('../utils/seedMemory').store; }

// GET /api/users - list all users (admin/manager only)
router.get('/', auth, requireRole('admin', 'manager'), (req, res) => {
  const store = getStore();
  const users = store.users.map(u => ({
    id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar
  }));
  res.json(users);
});

module.exports = router;
