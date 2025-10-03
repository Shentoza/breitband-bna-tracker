FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ="Europe/Berlin"
ENV EXPORT_PATH=/usr/src/app/export
ENV CHROME_PATH=/usr/bin/chromium
ENV CONFIG_PATH=/usr/src/app/config

# Build-time app version (set via --build-arg APP_VERSION=...)
ARG APP_VERSION=unspecified
ENV APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.version=${APP_VERSION}

ARG YARN_VERSION=4.10.3
ENV YARN_VERSION=${YARN_VERSION}
LABEL org.opencontainers.image.yarn_version=${YARN_VERSION}


# Copy package files and install deps
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
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json yarn.lock ./

# Ensure corepack is available and activate the pinned Yarn version before installing
# so the image uses the same Yarn as the project (prevents errors when 'yarn' isn't present)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}

RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

RUN yarn install --frozen-lockfile --production=false

# Copy app sources
COPY ./*.js .

# Ensure export dir exists and set ownership (allow failure)
RUN mkdir -p ${EXPORT_PATH} 
RUN chown node:node ${EXPORT_PATH}

# Ensure config dir exists and copy default config
RUN mkdir -p ${CONFIG_PATH}
COPY ./config.json ${CONFIG_PATH}/config.json

# Run as unprivileged user
USER node
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}
CMD ["node", "index.js"]
