/**
 * LinkedIn Lead Normalization API Server
 */

import express from 'express';
import leadRoutes from './routes/leads.js';
import stateRoutes from './routes/state.js';
import { initDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

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
app.use('/', stateRoutes);

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
  console.log(`\nStateless Intelligence Primitives:`);
  console.log(`  POST /normalize-lead - Normalize lead data`);
  console.log(`  POST /score-lead - Score and qualify lead`);
  console.log(`  POST /generate-message - Generate outreach message`);
  console.log(`  POST /classify-reply - Classify reply intent`);
  console.log(`  POST /draft-followup - Draft follow-up response`);
  console.log(`\nStateful Lead Management:`);
  console.log(`  POST   /leads - Create new lead`);
  console.log(`  GET    /leads/:id - Get lead by ID`);
  console.log(`  GET    /leads?campaign_id=X - Get leads by campaign`);
  console.log(`  GET    /leads?state=X - Get leads by state`);
  console.log(`  PATCH  /leads/:id/state - Update lead state`);
  console.log(`  PATCH  /leads/:id - Update lead data`);
  console.log(`  DELETE /leads/:id - Delete lead`);
  console.log(`\nCampaign Management:`);
  console.log(`  POST   /campaigns - Create new campaign`);
  console.log(`  GET    /campaigns/:id - Get campaign by ID`);
  console.log(`  GET    /campaigns?client_id=X - Get campaigns by client`);
  console.log(`  GET    /campaigns?status=X - Get campaigns by status`);
  console.log(`  PATCH  /campaigns/:id - Update campaign`);
  console.log(`  DELETE /campaigns/:id - Delete campaign`);
  console.log(`\nSystem:`);
  console.log(`  GET  /health - Health check`);
});

export default app;
