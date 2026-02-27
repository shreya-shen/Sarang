# --- Stage 1: Build Python dependencies ---
FROM python:3.11-slim AS python-deps

WORKDIR /deps

# Install only CPU version of torch (saves ~1.5 GB vs full CUDA build)
COPY server/python/requirements.txt .
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    torch --find-links https://download.pytorch.org/whl/cpu \
  && pip install --no-cache-dir -r requirements.txt \
  && pip install --no-cache-dir en-core-web-sm@https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.6.0/en_core_web_sm-3.6.0-py3-none-any.whl

# --- Stage 2: Final runtime image ---
FROM node:18-slim

# Install Python runtime (no build tools needed — wheels already compiled)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
  && ln -sf /usr/bin/python3 /usr/bin/python \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy pre-built Python packages from stage 1
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/dist-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Set Python path so it finds the copied packages
ENV PYTHONPATH="/usr/local/lib/python3.11/dist-packages:${PYTHONPATH}"

WORKDIR /app

# Install Node dependencies first (better layer caching)
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy application code
COPY server/ ./server/

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000
ENV MOOD_SERVICE_PORT=5001

EXPOSE 5000

# Health check — Render uses this
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"

# Start both Python mood service + Node server
CMD ["node", "server/start-production.js"]
