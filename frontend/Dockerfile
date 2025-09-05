FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
