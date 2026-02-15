#!/bin/bash
set -e


# Ensure we are in the directory of the script
cd "$(dirname "$0")"

# Validations
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Error: GEMINI_API_KEY environment variable is not set."
    echo "Please export it: export GEMINI_API_KEY='your_key_here'"
    exit 1
fi



# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1" # Adjust as needed
IMAGE_NAME="gcr.io/$PROJECT_ID/animation-orchestrator"
SERVICE_NAME="animation-orchestrator"

echo "Using Project ID: $PROJECT_ID"

# Build the container
echo "Building Docker image..."
docker build -t $IMAGE_NAME .

# Push to GCR (Optional if using Cloud Build, but here using local docker)
# echo "Pushing image to GCR..."
# docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud builds submit --tag $IMAGE_NAME
# Default bucket if not set
if [ -z "$FIREBASE_STORAGE_BUCKET" ]; then
    export FIREBASE_STORAGE_BUCKET="amibuddy-5fbc2.firebasestorage.app"
    echo "Using default bucket: $FIREBASE_STORAGE_BUCKET"
fi

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --execution-environment gen2 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET"
