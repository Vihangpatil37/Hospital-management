const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const registrationRoutes = require('./routes/registration.routes');
const queueRoutes = require('./routes/queue.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({
  origin: [env.CORS_ORIGIN_PATIENT, env.CORS_ORIGIN_ADMIN],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Expose io to req in routes
app.use((req, res, next) => {
    req.io = app.get('io');
    next();
});

// Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;
