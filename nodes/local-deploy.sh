#!/bin/bash
# local-deploy.sh for nodes-service
# Usage: ./local-deploy.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  Local deployment not implemented${NC}"
echo -e "${BLUE}💡 For Cloud Run deployment, use: ./deploy.sh${NC}"
echo ""
echo -e "${BLUE}This feature is not yet implemented.${NC}"
echo -e "${BLUE}Please use the Cloud Run deployment script instead.${NC}"
exit 1
