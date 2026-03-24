# Use the official Node.js 20 image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache ffmpeg

# Install pnpm
RUN npm install -g pnpm

# Copy pnpm workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy packages (core and client)
COPY packages/ ./packages/

# Copy cloud-run services
COPY cloud-run/graph-compose-nodes/nodes ./cloud-run/graph-compose-nodes/nodes/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages first (in dependency order)
RUN pnpm --filter="@graph-compose/types" build
RUN pnpm --filter="@graph-compose/db" build
RUN pnpm --filter="@graph-compose/secrets" build
# Clean stale build output then build the nodes app
RUN rm -rf cloud-run/graph-compose-nodes/nodes/lib && cd cloud-run/graph-compose-nodes/nodes && pnpm build

# Set working directory to nodes for runtime
WORKDIR /app/cloud-run/graph-compose-nodes/nodes

# Expose port
EXPOSE 8080

# Start the nodes service
CMD ["node", "lib/index.js"]
