#!/usr/bin/env node
/**
 * Production startup script for Sarang
 * Handles deployment environments (Railway, Render, etc.)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5000;

console.log(`Starting Sarang in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...\n`);

const pythonServicePath = path.join(__dirname, 'python', 'mood_service.py');

if (!fs.existsSync(pythonServicePath)) {
  console.error('Python mood service not found. Starting without it...');
  startNodeServer();
  return;
}

// Skip pip install in Docker (deps are pre-installed in the image)
// Go straight to starting the Python service
startPythonService();

function startPythonService() {
  console.log('Starting Python Mood Analysis Service...');
  
  // Try 'python3' first (standard on Debian/Ubuntu), fallback to 'python'
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const pythonService = spawn(pythonCmd, ['mood_service.py'], {
    cwd: path.join(__dirname, 'python'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  let pythonReady = false;

  pythonService.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Python] ${output.trim()}`);
    
    if (output.includes('Sarang Enhanced Mood Analysis Service is ready')) {
      pythonReady = true;
      console.log('Python service is ready!');
      setTimeout(startNodeServer, 1000);
    }
  });

  pythonService.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('FutureWarning') && !error.includes('UserWarning')) {
      console.error(`[Python Error] ${error.trim()}`);
    }
  });

  pythonService.on('error', (error) => {
    console.error('Failed to start Python service:', error.message);
    console.log('Starting Node server without Python optimization...');
    startNodeServer();
  });

  pythonService.on('exit', (code) => {
    if (code !== 0 && !pythonReady) {
      console.warn(`Python service exited with code ${code}`);
      console.log('Starting Node server without Python optimization...');
      startNodeServer();
    }
  });

  // Fallback: start Node server after timeout even if Python isn't ready
  // ML models can take 30-60s to load on cold start
  setTimeout(() => {
    if (!pythonReady) {
      console.log('⏱️ Python service still loading, starting Node server in parallel...');
      startNodeServer();
    }
  }, 60000);

  process.pythonService = pythonService;
}

function startNodeServer() {
  console.log(` Starting Main Node.js Server on port ${port}...`);
  
  const nodeServer = spawn('node', ['app.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });

  nodeServer.on('error', (error) => {
    console.error('Failed to start Node server:', error.message);
    process.exit(1);
  });

  // Store reference for cleanup
  process.nodeServer = nodeServer;

  // Setup graceful shutdown
  setupGracefulShutdown();

  console.log('\nSarang is starting up!');
  console.log(`Mood Service: http://localhost:5001 (if available)`);
  console.log(`Main App: http://localhost:${port}`);
}

function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    
    if (process.pythonService) {
      process.pythonService.kill('SIGTERM');
    }
    
    if (process.nodeServer) {
      process.nodeServer.kill('SIGTERM');
    }

    setTimeout(() => {
      console.log('Services shut down successfully');
      process.exit(0);
    }, 3000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
