// Force bypass of SSL certificate validation globally for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import dotenv from 'dotenv';
import { LLMService } from './services/LLMService';
import { createStorageService } from './services/StorageFactory';
import { ClassificationController } from './controllers/ClassificationController';
import { createRouter } from './api/routes';
import { validateClaudeConfig } from './config/claude.config';

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validateClaudeConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Initialize storage service (file-based or PostgreSQL based on STORAGE_TYPE env var)
  const storageService = await createStorageService();

  const llmService = new LLMService();

  // Test Claude connection
  console.log('Testing Claude connection...');
  const isConnected = await llmService.testConnection();
  if (!isConnected) {
    console.warn('⚠️  Warning: Failed to connect to Claude. Please check your ANTHROPIC_API_KEY.');
    console.warn('⚠️  Server will start but classification features will not work.');
  } else {
    console.log('✓ Claude connection successful');
  }

  // Initialize controller
  const controller = new ClassificationController(llmService, storageService);

  // Create Express app
  const app = express();
  app.use(express.json());

  // Add routes (pass storageService for analytics endpoints)
  app.use('/api', createRouter(controller, undefined, storageService));

  // Start server
  app.listen(PORT, () => {
    console.log(`\n🚀 LinkedIn Intent Classifier API running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Classify endpoint: POST http://localhost:${PORT}/api/classify\n`);
  });
}

// Handle startup errors
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Re-export core services
export { LLMService } from './services/LLMService';
export { PerplexityService } from './services/PerplexityService';
export { MessageGenerationService } from './services/MessageGenerationService';
export { StorageService, DatabaseService, createStorageService } from './services/StorageFactory';

// Re-export controllers
export { ClassificationController } from './controllers/ClassificationController';
export { MessagingController } from './controllers/MessagingController';

// Re-export tools
export { ResearchCompanyTool } from './tools/researchCompany';
export { DraftFollowupTool } from './tools/draftFollowup';

// Re-export hooks
export { PreMessageHook } from './hooks/PreMessageHook';
