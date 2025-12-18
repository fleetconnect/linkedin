import express from 'express';
import dotenv from 'dotenv';
import { LLMService } from './services/LLMService';
import { StorageService } from './services/StorageService';
import { ClassificationController } from './controllers/ClassificationController';
import { createRouter } from './api/routes';
import { validateConfig } from './config/llm.config';

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Initialize services
  const storageService = new StorageService();
  await storageService.initialize();

  const llmService = new LLMService();

  // Test LLM connection
  console.log('Testing LLM connection...');
  const isConnected = await llmService.testConnection();
  if (!isConnected) {
    console.error('Failed to connect to LLM service. Please check your API key.');
    process.exit(1);
  }
  console.log('✓ LLM connection successful');

  // Initialize controller
  const controller = new ClassificationController(llmService, storageService);

  // Create Express app
  const app = express();
  app.use(express.json());

  // Add routes
  app.use('/api', createRouter(controller));

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

export { LLMService, StorageService, ClassificationController };
