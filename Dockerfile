# Production Dockerfile for Railway deployment
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Install system dependencies for canvas and ffmpeg
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy package.json only (not package-lock.json to avoid sync issues)
COPY package.json ./

# Install dependencies using npm install (not npm ci)
RUN npm install --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories with correct permissions
RUN mkdir -p /tmp/uploads /tmp/temp /tmp/output && \
    chown -R appuser:appuser /app /tmp/uploads /tmp/temp /tmp/output

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]