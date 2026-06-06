const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'leadflow-secret-2024';

function getStore() {
  return require('../utils/seedMemory').store;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const store = getStore();
    const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });

    const store = getStore();
    if (store.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      _id: uuidv4(),
      name,
      email,
      password: hashed,
      role: role || 'sales_rep',
      avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      createdAt: new Date()
    };
    store.users.push(user);

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const store = getStore();
  const user = store.users.find(u => u._id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
});

module.exports = router;
