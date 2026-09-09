FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS dev
WORKDIR /app
EXPOSE 3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DRUPAL_BASE_URL
ARG NEXT_PUBLIC_DRUPAL_BASE_URL
ARG NEXT_IMAGE_DOMAIN
ARG NEXT_IMAGE_PROTOCOL
ARG ALLOW_EMPTY_EXPORT
ENV DRUPAL_BASE_URL=$DRUPAL_BASE_URL \
	NEXT_PUBLIC_DRUPAL_BASE_URL=$NEXT_PUBLIC_DRUPAL_BASE_URL \
	NEXT_IMAGE_DOMAIN=$NEXT_IMAGE_DOMAIN \
	NEXT_IMAGE_PROTOCOL=$NEXT_IMAGE_PROTOCOL \
	ALLOW_EMPTY_EXPORT=$ALLOW_EMPTY_EXPORT
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]