# ========================================================
# Stage 1: Build React + Vite Production Assets
# ========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

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
