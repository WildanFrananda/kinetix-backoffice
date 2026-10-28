# kinetix-backoffice

The staff web app of the Kinetix platform: one operator UI for every service, served at its own host behind the
staff network. It holds no token. The browser talks only to its own origin, where `kinetix-edge-service` keeps the
session under `/bff/` and this static app is everything else.

- **Stack:** TanStack Start (SPA mode), React 19, TanStack Router and Query, Valibot, TypeScript 7, Bun 1.4.4,
  served by nginx (unprivileged, read-only).
- **Design:** the Kinetix documentation's design system; tokens and marks copied from `kinetix-docs` under a lock.
- **Docs:** the REST reference this app follows is at https://docs.wildanfrananda.my.id/apis/rest/.

```sh
bin/dev bin/ci
```
