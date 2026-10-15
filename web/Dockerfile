# Multi-stage: сборка Expo web + nginx со статикой и проксированием API

# --- сборка JS ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY app.json tsconfig.json eslint.config.js ./
COPY src ./src
COPY assets ./assets
COPY plugins ./plugins

# Веб-версия ходит по своему же домену через прокси (см. default.conf.template):
#   /timet/embed/...   → timet.eremin.tech   (данные расписания)
#   /push-api/...      → pushtt (регистрация пушей, звонки)
ENV EXPO_PUBLIC_TIMET_API_URL=/timet
ENV EXPO_PUBLIC_PUSH_API_URL=/push-api

RUN npx expo export --platform web

# У статического prerender пустой <title> — прокидываем дефолтный заголовок сайта
# (на живые переходы expo-router/head всё равно обновит <title> в рантайме)
RUN sed -i 's|<title data-rh="true"></title>|<title data-rh="true">Расписание ЧРТ</title>|g' dist/*.html

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
