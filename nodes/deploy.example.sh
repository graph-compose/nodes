#!/bin/bash
# deploy.sh for nodes-service
# Usage: ./deploy.sh [--build-only]
#
# Copy this file to deploy.sh and fill in your GCP project details.
# deploy.sh is gitignored and will not be tracked.

set -e

# Configuration — replace with your values
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-gcp-project-id"}
REGION=${CLOUD_RUN_REGION:-"us-central1"}
SERVICE_NAME="nodes-service"
BUILD_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--build-only]"
            echo ""
            echo "Options:"
            echo "  --build-only    Only build the Docker image, don't deploy to Cloud Run"
            echo ""
            echo "Environment Variables:"
            echo "  GOOGLE_CLOUD_PROJECT  - GCP Project ID"
            echo "  CLOUD_RUN_REGION      - Cloud Run region (default: us-central1)"
            exit 0
            ;;
        *)
            echo "Error: Unknown argument '$1'"
            exit 1
            ;;
    esac
done

echo "Deploying $SERVICE_NAME..."
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Build Only: $BUILD_ONLY"

gcloud config set project $PROJECT_ID

BUILD_TAG="manual-$(date +%Y%m%d-%H%M%S)"

# Resolve paths relative to this script so it works from any cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CLOUDBUILD_CONFIG="cloud-run/graph-compose-nodes/nodes/cloudbuild.yaml"

# Build from repository root so cloudbuild path resolution is stable
cd "$REPO_ROOT"

gcloud beta builds submit \
    --config="$CLOUDBUILD_CONFIG" \
    --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_TAG=$BUILD_TAG,_PROJECT_ID=$PROJECT_ID \
    .

if [[ $? -eq 0 ]]; then
    echo "$SERVICE_NAME deployed successfully"
else
    echo "Failed to deploy $SERVICE_NAME"
    exit 1
fi
