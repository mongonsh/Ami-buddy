#!/bin/bash
set -e

echo "🚀 Deploying AmiBuddy Web to Cloud Run..."
echo "=========================================="

# 1. Configuration - Secrets should be loaded from environment
# Ensure these variables are set in your environment before running this script


# 2. Project Setup
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"
SERVICE_NAME="amibuddy-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/frontend"

echo "Using Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo ""

# 3. Submit Build to Cloud Build
echo "📦 Building Docker image with Cloud Build..."
echo "   (This may take a few minutes)"
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY",_ELEVENLABS_VOICE_ID="$ELEVENLABS_VOICE_ID",_ELEVENLABS_MODEL_ID="$ELEVENLABS_MODEL_ID",_MEMU_API_KEY="$MEMU_API_KEY",_MEMU_USER_ID="$MEMU_USER_ID",_MEMU_AGENT_ID="$MEMU_AGENT_ID",_MEMU_BASE_URL="$MEMU_BASE_URL",_SAM_API_URL="$SAM_API_URL",_SAM_API_KEY="$SAM_API_KEY",_GEMINI_API_KEY="$GEMINI_API_KEY",_ANIMATION_API_URL="$ANIMATION_API_URL",_EXPO_PUBLIC_FIREBASE_API_KEY="$EXPO_PUBLIC_FIREBASE_API_KEY",_EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="$EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",_EXPO_PUBLIC_FIREBASE_PROJECT_ID="$EXPO_PUBLIC_FIREBASE_PROJECT_ID",_EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="$EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",_EXPO_PUBLIC_FIREBASE_APP_ID="$EXPO_PUBLIC_FIREBASE_APP_ID",_EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="$EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID"

# 4. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 80

echo ""
echo "✅ Deployment Complete!"
echo "   Visit your URL above to see the changes."
