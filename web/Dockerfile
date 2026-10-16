# Multi-stage: сборка Expo web + nginx со статикой и проксированием API

# --- сборка JS ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY app.json tsconfig.json eslint.config.js index.js ./
COPY src ./src
COPY assets ./assets
COPY plugins ./plugins
COPY web/inject-web.mjs ./web/inject-web.mjs

# Веб-версия ходит по своему же домену через прокси (см. default.conf.template):
#   /timet/embed/...   → timet.eremin.tech   (данные расписания)
#   /push-api/...      → pushtt (регистрация пушей, звонки)
ENV EXPO_PUBLIC_TIMET_API_URL=/timet
ENV EXPO_PUBLIC_PUSH_API_URL=/push-api

RUN npx expo export --platform web

# GTM (Google Tag Manager) + дефолтный заголовок сайта
ARG GTM_ID=GTM-TX5CR7L9
ENV GTM_ID=${GTM_ID}
RUN node web/inject-web.mjs

# --- раздача ---
FROM nginx:1.27-alpine

# Дефолты (compose/env может переопределить)
ENV TIMET_UPSTREAM=https://timet.eremin.tech
ENV WEB_PUSH_BACKEND=http://host.docker.internal:4000

COPY web/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# WEB_PUSH_BACKEND — адрес pushtt (HTTP), напр. http://host.docker.internal:4000
# TIMET_UPSTREAM     — источник расписания, напр. https://timet.eremin.tech
EXPOSE 80
