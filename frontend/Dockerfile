FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run development server with host 0.0.0.0 to allow Docker access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
