import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import leadRoutes from './routes/leads';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'linkedin-campaign-manager',
  });
});

// API Routes
app.use('/api/leads', leadRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 LinkedIn Campaign Manager API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server running on: http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
API base URL: http://localhost:${PORT}/api

Orchestration Endpoints:
  POST   /api/leads                       Create lead
  GET    /api/leads                       List leads
  GET    /api/leads/:id                   Get lead
  POST   /api/leads/:id/normalize         Normalize lead
  POST   /api/leads/:id/score             Score lead
  POST   /api/leads/:id/generate-message  Generate message
  POST   /api/leads/:id/classify-reply    Classify reply

Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
