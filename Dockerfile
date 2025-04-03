# Use an official Node.js runtime as a parent image
FROM node:18-bullseye

# Set the working directory in the container
WORKDIR /workspace

# Install dependencies required for Puppeteer/Chromium
# Based on https://pptr.dev/troubleshooting#running-puppeteer-in-docker
# and including specific libraries mentioned in the request (libatspi2.0-0, libpango-1.0-0)
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates procps libxss1 \
    # Added dependencies for Chromium:
    libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxtst6 lsb-release \
    # Added specifically requested dependencies (likely covered above, but explicit):
    libatspi2.0-0 \
    # Fonts:
    fonts-liberation \
    # Utilities:
    xdg-utils xvfb \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Create .vscode-server directory and set ownership for node user (UID 1000)
RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server

# Copy application dependency manifests to leverage Docker cache
# Copying only package files first to cache the npm install step
COPY platform/package.json platform/package-lock.json* ./platform/

# Copy the rest of the application code
# Note: This copies the entire project context into the container's workspace
COPY . .

# Install Playwright browser binary
RUN npx playwright install chromium

# Expose the port the app runs on
EXPOSE 3000

# Default command can be overridden in devcontainer.json or docker-compose.yml
# Here, we just keep the container running. The postCreateCommand will handle npm install.
CMD ["sleep", "infinity"]