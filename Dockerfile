# syntax=docker/dockerfile:1.7
# Build is intentionally performed in Docker; do not install Node/npm locally.
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

# Keep dependency layers cacheable.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# .dockerignore excludes encrypted/protected source (for example *.src/*.enc).
COPY . .
# Materialize reviewed plaintext sources only inside the build image.
COPY runtime_templates/src/api.js.tmpl /app/src/api.js
COPY runtime_templates/src/main.jsx.tmpl /app/src/main.jsx
COPY runtime_templates/src/part-search.jsx.tmpl /app/src/part-search.jsx
COPY runtime_templates/src/management.jsx.tmpl /app/src/management.jsx
COPY runtime_templates/src/part-detail.jsx.tmpl /app/src/part-detail.jsx
COPY runtime_templates/src/styles.css.tmpl /app/src/styles.css
COPY runtime_templates/src/ui.jsx.tmpl /app/src/ui.jsx
COPY runtime_templates/src/upload-contract.js.tmpl /app/src/upload-contract.js
# Protected host index.html is excluded; use the container-safe entrypoint.
COPY index.safe.html /app/index.html
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ENV NGINX_PORT=80
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]

