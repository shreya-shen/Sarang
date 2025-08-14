#!/usr/bin/env node
/**
 * Production startup script for Sarang
 * Handles deployment environments (Railway, Render, etc.)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5000;

console.log(`🚀 Starting Sarang in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...\n`);

// Check if Python service files exist
const pythonServicePath = path.join(__dirname, 'python', 'mood_service.py');
const requirementsPath = path.join(__dirname, 'python', 'requirements_service.txt');

if (!fs.existsSync(pythonServicePath)) {
  console.error('❌ Python mood service not found. Starting without optimization...');
  startNodeServer();
  return;
}

// Install Python dependencies if needed
if (fs.existsSync(requirementsPath)) {
  console.log('📦 Checking Python dependencies...');
  exec('pip install -r requirements_service.txt', {
    cwd: path.join(__dirname, 'python')
  }, (error, stdout, stderr) => {
    if (error) {
      console.warn('⚠️ Python dependencies installation failed:', error.message);
      console.log('🔄 Continuing without Python service...');
      startNodeServer();
    } else {
      console.log('✅ Python dependencies ready');
      startPythonService();
    }
  });
} else {
  startPythonService();
}

function startPythonService() {
  console.log('🎭 Starting Python Mood Analysis Service...');
  
  const pythonService = spawn('python', ['mood_service.py'], {
    cwd: path.join(__dirname, 'python'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let pythonReady = false;

  pythonService.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Python] ${output.trim()}`);
    
    // Check if service is ready
    if (output.includes('Sarang Enhanced Mood Analysis Service is ready')) {
      pythonReady = true;
      console.log('✅ Python service is ready!');
      setTimeout(startNodeServer, 1000);
    }
  });

  pythonService.stderr.on('data', (data) => {
    const error = data.toString();
    // Only show critical errors, not warnings
    if (!error.includes('FutureWarning') && !error.includes('UserWarning')) {
      console.error(`[Python Error] ${error.trim()}`);
    }
  });

  pythonService.on('error', (error) => {
    console.error('❌ Failed to start Python service:', error.message);
    console.log('🔄 Starting Node server without Python optimization...');
    startNodeServer();
  });

  pythonService.on('exit', (code) => {
    if (code !== 0 && !pythonReady) {
      console.warn(`⚠️ Python service exited with code ${code}`);
      console.log('🔄 Starting Node server without Python optimization...');
      startNodeServer();
    }
  });

  // Fallback: start Node server after timeout even if Python isn't ready
  setTimeout(() => {
    if (!pythonReady) {
      console.log('⏱️ Python service taking too long, starting Node server...');
      startNodeServer();
    }
  }, 15000); // 15 second timeout

  // Store reference for cleanup
  process.pythonService = pythonService;
}

function startNodeServer() {
  console.log(`🌟 Starting Main Node.js Server on port ${port}...`);
  
  const nodeServer = spawn('node', ['app.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });

  nodeServer.on('error', (error) => {
    console.error('❌ Failed to start Node server:', error.message);
    process.exit(1);
  });

  // Store reference for cleanup
  process.nodeServer = nodeServer;

  // Setup graceful shutdown
  setupGracefulShutdown();

  console.log('\n✅ Sarang is starting up!');
  console.log(`🎵 Mood Service: http://localhost:8001 (if available)`);
  console.log(`🌐 Main App: http://localhost:${port}`);
}

function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
    
    if (process.pythonService) {
      process.pythonService.kill('SIGTERM');
    }
    
    if (process.nodeServer) {
      process.nodeServer.kill('SIGTERM');
    }

    setTimeout(() => {
      console.log('✅ Services shut down successfully');
      process.exit(0);
    }, 3000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
