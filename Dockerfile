FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV EXPORT_PATH=/export
ENV TZ="Europe/Berlin"
ENV CHROME_PATH=/usr/bin/chromium


# Copy package files and install deps
RUN  apt-get update
RUN apt-get install -y procps libxss1 chromium
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false


# Copy app sources
COPY ./*.js .

# Ensure export dir exists
RUN mkdir -p ${EXPORT_PATH} 
RUN chown node:node ${EXPORT_PATH} || true

# Expose export as a mount point
VOLUME ["${EXPORT_PATH}"]

# Run as unprivileged user
USER node

CMD ["node", "index.js"]
