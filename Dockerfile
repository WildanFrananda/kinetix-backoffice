FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM nginxinc/nginx-unprivileged:1.30.6-alpine-slim@sha256:5d8bb9437d74a600ec5dbf90c035451c724dc33eac8d3a71078f6f8612c345f6

ARG KINETIX_SERVICE_VERSION
ENV KINETIX_SERVICE_VERSION=${KINETIX_SERVICE_VERSION}

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/headers.conf /etc/nginx/kinetix/headers.conf
COPY --from=build /app/dist/nginx/csp.conf /etc/nginx/kinetix/csp.conf
COPY --from=build /app/dist/client /usr/share/nginx/html

USER 101
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]
