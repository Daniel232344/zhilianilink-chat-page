npm的版本：10.2.4
node的版本：v18.19.1
运行方式：npm i下载依赖
npm run dev 打开项目。
如果有奇怪的报错，删除掉node_modules重新下载
dockerfile如下
# syntax=docker/dockerfile:1
# 保留此语法指令！它用于启用 Docker BuildKit

################################
# BUILDER-BASE 构建基础
################################

# 1. 强制平台为当前架构，以提高多平台构建时的构建速度
FROM --platform=$BUILDPLATFORM node:lts-bookworm-slim as builder-base
WORKDIR /frontend
COPY . /frontend
RUN cd /frontend && npm install && npm run build

################################
# RUNTIME 运行时
################################
FROM nginxinc/nginx-unprivileged:stable-bookworm-perl as runtime

LABEL org.opencontainers.image.title=ilink-main-frontend
LABEL org.opencontainers.image.authors=['iLink']

# 从构建基础镜像中将构建好的前端内容复制到 Nginx 默认静态资源目录下，且设置文件归属为 nginx 用户
COPY --from=builder-base --chown=nginx /frontend/dist /usr/share/nginx/html
# 将自定义的 Nginx 配置文件复制到 Nginx 配置目录，并设置文件归属为 nginx 用户
COPY --chown=nginx ./docker/nginx.conf /etc/nginx/conf.d/default.conf
# 将启动 Nginx 的脚本文件复制到根目录下，并设置文件归属为 nginx 用户
COPY --chown=nginx ./docker/start-nginx.sh /start-nginx.sh
# 为启动脚本添加执行权限
RUN chmod +x /start-nginx.sh

# 进入无限等待模式
CMD sleep infinity
