# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port for Expo web (default is 19006)
EXPOSE 19006

# Start the web server
CMD ["npm", "run", "web"]