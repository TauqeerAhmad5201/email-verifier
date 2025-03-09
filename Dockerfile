# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory for the build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy application files
COPY . .

# If you have a build step, uncomment this:
# RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only production dependencies and built files from builder stage
COPY --from=builder /app/package*.json ./
RUN npm install --production && npm cache clean --force

# Copy all necessary files from builder stage
# This makes sure we include all needed files (routes, views, public folder, etc.)

COPY --from=builder /app/public ./public

COPY --from=builder /app/*.js ./
COPY --from=builder /app/*.json ./
# If you have specific config files or other important files, add them here

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]