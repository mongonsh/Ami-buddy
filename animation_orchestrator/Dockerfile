FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and rembg (u2net models needed)
# Install system dependencies for OpenCV and rembg (u2net models needed)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install SAM 2 from GitHub
RUN pip install --no-cache-dir git+https://github.com/facebookresearch/sam2.git

# Download SAM 2 Checkpoints
COPY download_checkpoints.py .
RUN python download_checkpoints.py

# Pre-download rembg u2net model to avoid doing it at runtime
RUN python -c "from rembg.session_factory import new_session; new_session('u2net')"

COPY . .

# Run the web service on container startup.
# Run the web service on container startup.
# Use shell form to allow variable expansion
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
