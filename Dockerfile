FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV EXPORT_PATH=/usr/src/app/export
ENV TZ="Europe/Berlin"
ENV CHROME_PATH=/usr/bin/chromium
ENV CONFIG_PATH=/usr/src/app/config


# Copy package files and install deps
RUN  apt-get update
RUN apt-get install -y procps libxss1 chromium
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

# Copy app sources
COPY ./*.js .

# Ensure export dir exists and set ownership (allow failure)
RUN mkdir -p ${EXPORT_PATH} 
RUN chown node:node ${EXPORT_PATH} || true

# Ensure config dir exists and copy default config
RUN mkdir -p ${CONFIG_PATH}
COPY ./config.json ${CONFIG_PATH}/config.json

# Expose export and config as mount points
VOLUME ${EXPORT_PATH}
VOLUME ${CONFIG_PATH}

# Run as unprivileged user
USER node

CMD ["node", "index.js"]
