# Stage 1: Build stage
FROM node:20 AS builder

# Set the working directory in the builder container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code into JavaScript
RUN npm run build

# Stage 2: Production stage
FROM node:20

# Set the working directory in the production container
WORKDIR /usr/src/app

# Copy only the production dependencies from the builder image
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --only=production

# Copy only the compiled JavaScript code and other necessary files from the builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy the Prisma client generated files
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Expose the application port
EXPOSE 8083

# Run the compiled app
CMD ["node", "dist/index.js"]
