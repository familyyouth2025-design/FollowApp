const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Auto-create missing tables
const db = require('./db');
async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      template TEXT NOT NULL,
      created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Database tables initialized');
}
initDB().catch(err => console.error('DB init error:', err.message));

// Initialize WhatsApp client on startup
const { initClient } = require('./whatsapp');
initClient();
console.log('WhatsApp client initialized on server startup');

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/members', require('./routes/members'));
app.use('/api/events', require('./routes/events'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/files', require('./routes/files'));
app.use('/api/csv', require('./routes/csv'));
app.use('/api/churches', require('./routes/churches'));
app.use('/api/saved-messages', require('./routes/savedMessages'));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
