/**
 * LinkedIn Lead Normalization API Server
 */

import express from 'express';
import leadRoutes from './routes/leads.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', leadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`LinkedIn Lead Normalization API running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /normalize-lead - Normalize lead data`);
  console.log(`  POST /score-lead - Score and qualify lead`);
  console.log(`  POST /generate-message - Generate outreach message`);
  console.log(`  POST /classify-reply - Classify reply intent`);
  console.log(`  GET  /health - Health check`);
});

export default app;
