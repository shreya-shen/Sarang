#!/usr/bin/env node
/**
 * Startup script for Sarang - starts both Python mood service and Node.js server
 * This ensures the Python service is running before the main app starts
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Sarang Services...\n');

// Start Python mood service
console.log('Starting Python Mood Analysis Service...');
const pythonService = spawn('python', ['mood_service.py'], {
  cwd: path.join(__dirname, 'python'),
  stdio: 'inherit'
});

// Wait for Python service to initialize
setTimeout(() => {
  console.log('\nStarting Main Node.js Server...');
  
  // Start main Node.js server
  const nodeServer = spawn('node', ['app.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down services gracefully...');
    pythonService.kill('SIGTERM');
    nodeServer.kill('SIGTERM');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    pythonService.kill('SIGTERM');
    nodeServer.kill('SIGTERM');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

}, 3000); // Wait 3 seconds for Python service to initialize

console.log('\nBoth services will be available shortly!');
console.log('Mood Service: http://localhost:8001');
console.log('Main App: http://localhost:5000 (or your configured port)');
console.log('\nPress Ctrl+C to stop both services');
