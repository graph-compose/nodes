# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (ffmpeg needed by yt-dlp for format merging/audio extraction)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Set environment variables
ENV PYTHONPATH=/app
ENV LOG_LEVEL=info
# Add default port for Cloud Run
ENV PORT=8080

# Use gunicorn for production with proper logging configuration
CMD exec gunicorn --bind :$PORT \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 0 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    src.app:app 