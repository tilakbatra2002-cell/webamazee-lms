FROM node:20-slim

# Install system Chromium + fonts/libs Puppeteer needs to run headless Chrome in a container.
# We use PUPPETEER_SKIP_DOWNLOAD + PUPPETEER_EXECUTABLE_PATH to point at the apt-installed
# Chromium instead of Puppeteer's own bundled download, which keeps the image smaller and
# avoids flaky downloads during `docker build`.
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/proposals

EXPOSE 5000

CMD ["node", "server.js"]
