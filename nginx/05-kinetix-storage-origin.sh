#!/bin/sh
set -eu

origin="${KINETIX_STORAGE_ORIGIN:-}"

if [ -z "$origin" ]; then
  echo "$0: KINETIX_STORAGE_ORIGIN is not set; the Content-Security-Policy's img-src needs the storage origin that serves proof-of-delivery photos" >&2
  exit 1
fi

if ! printf '%s\n' "$origin" | grep -Eqx 'https?://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?'; then
  echo "$0: KINETIX_STORAGE_ORIGIN must be an origin, a scheme and a host with an optional port, such as https://storage.example.com" >&2
  exit 1
fi
