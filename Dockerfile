### Multi-stage Dockerfile: builder -> runtime
FROM node:24-bookworm-slim AS builder

ARG YARN_VERSION=4.10.3
ENV YARN_VERSION=${YARN_VERSION}
WORKDIR /usr/src/app


COPY package.json yarn.lock ./


RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate
RUN yarn install --immutable --production=true || npm install --no-audit --no-fund --production

# Copy only sources needed for runtime
COPY ./*.js ./


### Runtime image: only runtime artifacts + minimal libraries for Chromium
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

# Copy node_modules and app sources from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/*.js ./

# Ensure export dir exists and set ownership
RUN mkdir -p ${EXPORT_PATH} && chown node:node ${EXPORT_PATH}

# Ensure config dir exists and copy default config
RUN mkdir -p ${CONFIG_PATH}
COPY ./config.json ${CONFIG_PATH}/config.json

# Run as non-root
USER node

ENV PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}
CMD ["node", "index.js"]