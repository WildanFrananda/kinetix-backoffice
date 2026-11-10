FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM nginxinc/nginx-unprivileged:1.31.7-alpine-slim@sha256:a8cb0f33d51fa107c96fd2bd3a71aaf564ec131e9d2bdf8700944f0ed8b170d7

ARG KINETIX_SERVICE_VERSION
ENV KINETIX_SERVICE_VERSION=${KINETIX_SERVICE_VERSION} \
    NGINX_ENVSUBST_OUTPUT_DIR=/tmp \
    NGINX_ENVSUBST_FILTER=KINETIX_STORAGE_ORIGIN

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/headers.conf /etc/nginx/kinetix/headers.conf
COPY --chmod=0755 nginx/05-kinetix-storage-origin.sh /docker-entrypoint.d/05-kinetix-storage-origin.sh
COPY --from=build /app/dist/nginx/csp.conf.template /etc/nginx/templates/kinetix/csp.conf.template
COPY --from=build /app/dist/client /usr/share/nginx/html

USER 101
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
