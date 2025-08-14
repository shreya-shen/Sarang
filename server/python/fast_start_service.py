#!/usr/bin/env python3
"""
Fast startup version - uses cached models only
"""

import sys
import os
import signal
import time
from pathlib import Path

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

def signal_handler(sig, frame):
    print('\n🛑 Gracefully shutting down service...')
    sys.exit(0)

def fast_start():
    """Start service quickly using pre-cached models"""
    print("⚡ Fast-Starting Ultra-Advanced Mood Detection Service...")
    print("=" * 60)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Skip dependency check - assume pre-installed
        print("🚀 Using pre-cached models for instant startup...")
        
        # Import and start the service
        from production_mood_service import app
        import uvicorn
        
        # Configuration
        host = os.getenv('MOOD_SERVICE_HOST', '127.0.0.1')
        port = int(os.getenv('MOOD_SERVICE_PORT', 5001))
        
        print(f"🌟 Fast Service Configuration:")
        print(f"   📡 Host: {host}")
        print(f"   🔌 Port: {port}")
        print(f"   ⚡ Mode: Fast Start")
        print("=" * 60)
        print(f"🔗 Service URLs:")
        print(f"   Main API: http://{host}:{port}")
        print(f"   Health Check: http://{host}:{port}/health")
        print(f"   API Documentation: http://{host}:{port}/docs")
        print("=" * 60)
        print("⚡ Ready! Press Ctrl+C to stop")
        
        # Start with minimal logging for speed
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="warning",  # Reduce logging overhead
            access_log=False,     # Disable access logs for speed
            reload=False
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        print("💡 Try running 'python preload_models.py' first")
        sys.exit(1)

if __name__ == "__main__":
    print("⚡ Ultra-Fast Mood Detection Service")
    print("🎯 Pre-cached models for instant startup")
    print()
    fast_start()
