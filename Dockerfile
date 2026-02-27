# --- Stage 1: Build Python dependencies + download ML models ---
FROM python:3.11-slim AS python-deps

WORKDIR /deps

# Install only CPU version of torch (saves ~1.5 GB vs full CUDA build)
COPY server/python/requirements.txt .
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    torch --find-links https://download.pytorch.org/whl/cpu \
  && pip install --no-cache-dir -r requirements.txt \
  && pip install --no-cache-dir en-core-web-sm@https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.6.0/en_core_web_sm-3.6.0-py3-none-any.whl

# Pre-download HuggingFace models so they are baked into the image
# (avoids ~500 MB download on every container start)
ENV HF_HOME=/deps/hf_cache
RUN python -c "\
from transformers import pipeline; \
pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment-latest'); \
pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base'); \
print('Models downloaded successfully')"

# --- Stage 2: Final runtime image ---
FROM python:3.11-slim AS runtime

# Install Node.js 18
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
  && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy pre-built Python packages from stage 1
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy pre-downloaded HuggingFace models
COPY --from=python-deps /deps/hf_cache /app/.hf_cache

# Set environment for Python + HuggingFace
ENV HF_HOME=/app/.hf_cache
ENV TRANSFORMERS_OFFLINE=1

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
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"

# Start both Python mood service + Node server
CMD ["node", "server/start-production.js"]
