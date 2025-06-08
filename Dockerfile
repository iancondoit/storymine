# Multi-stage build for StoryMine
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM node:18-alpine as backend-build
WORKDIR /app/backend
COPY src/backend/package*.json ./
RUN npm ci
COPY src/backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl bash

# Copy backend build (compiled JavaScript and scripts)
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/scripts ./backend/scripts
COPY --from=backend-build /app/backend/package*.json ./backend/

# Copy frontend build
COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY --from=frontend-build /app/frontend/package*.json ./frontend/
COPY --from=frontend-build /app/frontend/next.config.js ./frontend/

# Install only production dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Install only production dependencies for frontend
WORKDIR /app/frontend
RUN npm ci --only=production && npm cache clean --force

# Create startup script - backend on 3001, frontend serves from same port
WORKDIR /app
RUN echo '#!/bin/bash' > start.sh && \
    echo 'export PORT=3001' >> start.sh && \
    echo 'export BACKEND_PORT=3001' >> start.sh && \
    echo 'cd /app/backend && PORT=3001 npm start' >> start.sh && \
    chmod +x start.sh

# Health check pointing to backend health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["./start.sh"] 