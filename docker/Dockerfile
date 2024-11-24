# syntax=docker/dockerfile:1
# Keep this syntax directive! It's used to enable Docker BuildKit

################################
# BUILDER-BASE
################################

# 1. force platform to the current architecture to increase build speed time on multi-platform builds
FROM --platform=$BUILDPLATFORM node:lts-bookworm-slim as builder-base
WORKDIR /frontend
COPY . /frontend
RUN cd /frontend && npm install && npm run build

################################
# RUNTIME
################################
FROM nginxinc/nginx-unprivileged:stable-bookworm-perl as runtime

LABEL org.opencontainers.image.title=ilink-main-frontend
LABEL org.opencontainers.image.authors=['iLink']

COPY --from=builder-base --chown=nginx /frontend/dist /usr/share/nginx/html
COPY --chown=nginx ./docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx ./docker/start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

CMD sleep infinity
