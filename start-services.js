const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Sarang Mood Music Application...');

// Function to start a service
function startService(name, command, args, cwd, color) {
    console.log(`${color}Starting ${name}...${'\x1b[0m'}`);
    
    const service = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, FORCE_COLOR: 1 }
    });

    service.stdout.on('data', (data) => {
        process.stdout.write(`${color}[${name}] ${data}${'\x1b[0m'}`);
    });

    service.stderr.on('data', (data) => {
        process.stderr.write(`${color}[${name}] ${data}${'\x1b[0m'}`);
    });

    service.on('error', (error) => {
        console.error(`${color}[${name}] Error: ${error.message}${'\x1b[0m'}`);
    });

    service.on('close', (code) => {
        console.log(`${color}[${name}] Process exited with code ${code}${'\x1b[0m'}`);
    });

    return service;
}

// Start all services
try {
    // Start Python mood service
    const pythonService = startService(
        'Python AI', 
        'python', 
        ['server/python/production_mood_service.py'], 
        __dirname,
        '\x1b[32m' // Green
    );

    // Start Express server
    const expressService = startService(
        'Express Server',
        'node',
        ['server/app.js'],
        __dirname,
        '\x1b[34m' // Blue
    );

    console.log('\x1b[36m%s\x1b[0m', '✅ All services started successfully!');
    console.log('\x1b[36m%s\x1b[0m', '🔗 Backend API: http://localhost:5000');
    console.log('\x1b[36m%s\x1b[0m', '🎵 Access your Sarang app and start discovering music based on your mood!');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\x1b[33m%s\x1b[0m', '🛑 Shutting down services...');
        pythonService.kill('SIGINT');
        expressService.kill('SIGINT');
        process.exit(0);
    });

} catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error starting services:', error.message);
    process.exit(1);
}
