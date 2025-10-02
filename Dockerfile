FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ="Europe/Berlin"
ENV EXPORT_PATH=/usr/src/app/export
ENV CHROME_PATH=/usr/bin/chromium
ENV CONFIG_PATH=/usr/src/app/config


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
