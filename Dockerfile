# ========================================================
# Stage 1: Build React + Vite Production Assets
# ========================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Injected environment variables for Vite build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_API_URL

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV npm_config_engine_strict=false
ENV npm_config_loglevel=error

COPY package*.json ./
RUN npm ci --engine-strict=false || npm install --engine-strict=false

COPY . .
RUN npm run build

# ========================================================
# Stage 2: Production Python FastAPI Server
# ========================================================
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY module/requirements.txt ./module/requirements.txt
RUN pip install --no-cache-dir -r module/requirements.txt

COPY module/ ./module/
COPY --from=frontend-builder /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["sh", "-c", "uvicorn module.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
