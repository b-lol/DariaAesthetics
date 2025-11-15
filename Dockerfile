# Use official Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install

# Copy entire project (includes pages, css, js, img, components, backend)
COPY . .

# Set working directory to backend for running the server
WORKDIR /app/backend

# Expose port (Railway will override with its own PORT)
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
