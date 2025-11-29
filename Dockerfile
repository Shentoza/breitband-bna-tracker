FROM node:24-bookworm-slim AS builder
WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && \
    YARN_PM=$(node -p "require('./package.json').packageManager") && \
    corepack prepare "$YARN_PM" --activate
RUN yarn install --immutable

COPY tsconfig.json vite.config.ts ./
COPY src/ ./src/
RUN yarn build

RUN rm -rf node_modules yarn.lock
RUN node -e "const pkg=require('./package.json'); delete pkg.devDependencies; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"
RUN yarn install


FROM node:24-bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ="Europe/Berlin"
ENV EXPORT_PATH=/usr/src/app/export 
ENV CHROME_PATH=/usr/bin/chromium 
ENV CONFIG_PATH=/usr/src/app/config 
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ARG APP_VERSION=unspecified
ENV APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.version=${APP_VERSION}

WORKDIR /usr/src/app

# Install only system libraries required by Chromium (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libxshmfence1 \
    libglu1-mesa \
    chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Ensure export dir exists and set ownership
RUN mkdir -p ${EXPORT_PATH} && chown node:node ${EXPORT_PATH}

# Ensure config dir exists and copy default config
RUN mkdir -p ${CONFIG_PATH}
COPY ./config.json ${CONFIG_PATH}/config.json

# Run as non-root
USER node

ENV PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}
CMD ["node", "dist/breitbandmessung-mqtt.js"]