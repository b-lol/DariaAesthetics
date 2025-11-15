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

# Expose port (Railway will override with its own PORT)
EXPOSE 8080

# Start the server from /app directory
CMD ["node", "backend/server.js"]