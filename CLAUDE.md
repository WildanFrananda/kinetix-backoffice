# CLAUDE.md — kinetix-backoffice

The staff web app at `backoffice.wildanfrananda.my.id`, the one operator UI for every Kinetix service. Plan of record:
`kinetix-infrastructure/docs/BACKOFFICE.md` (rulings BO-D1–D7, API gaps §7, order of work §8). This repository is
public: never commit staff ranges, addresses, server names or anything from the infrastructure repository.

## What it is, and what it never does

- **A client, not a service.** It owns no data, decides no business rule and coordinates no transaction. Every
  screen is a documented REST endpoint from `kinetix-docs` `apis/rest/backoffice/`. A screen whose endpoint does not
  exist waits until the owning service builds it; there is no mock, placeholder data or fake screen in the meantime.
- **It never holds a token.** The browser calls only its own origin. `/bff/*` is `kinetix-edge-service`, which keeps
  the session behind the `HttpOnly` cookie `__Host-kx_session` and adds the bearer token. Everything else on the host
  is this app, served by nginx (`backoffice-app-route` in `kinetix-api-gateway`). Both sit behind the staff gate.
- **Unknown is not no.** Every answer is parsed (`valibot`); a shape the app does not know is a failure shown with
  its reference, never empty data (`src/api/bff_request.ts`, `src/types/bff_failure.type.ts`).

## Stack

Bun 1.4.4 (toolchain image `oven/bun:1.4.4-slim`, pinned by digest), TanStack Start in SPA mode on Vite 8, React 19,
TanStack Router, Query and Form, React Aria Components, Valibot, `qrcode.react`, CSS Modules over the shared tokens
with generated declarations (`typed-css-modules`), TypeScript 7, Biome with the estate's GritQL plugins, Vitest with
jsdom and Testing Library (run under Bun: `bunx --bun vitest`), Playwright 1.64.1 with `otpauth` for the lab E2E. Production is the static build on
`nginxinc/nginx-unprivileged` (pinned by digest), user 101, read-only root.

## Run everything in the toolchain

```sh
bin/dev bin/ci          # install, Biome, CSS-module types + tsc, Vitest, build, built-in leak rules
bin/dev bun run css-types   # regenerate src/**/*.module.d.css.ts after changing a CSS module
bin/dev bun run build   # dist/client (the app) and dist/nginx/csp.conf
bin/dev down            # remove the toolchain's volumes
```

Nothing is installed on the laptop. `node_modules` lives in a Docker volume, so the host's `node_modules/` is an
empty mount point.

## Code style (the estate's TypeScript rules)

- `type` for shapes, one per file in `src/types/*.type.ts`; `interface` only where TypeScript requires one
  (`src/types/register.d.ts`, the router's module augmentation).
- Functions are declared with `function`; an arrow only as an anonymous callback. Exports at the bottom of the file.
  Both are enforced by `biome-plugins/*.grit`, copied from `kinetix-seal-service`.
- No comments; the reasoning lives here.
- React components in PascalCase files, every other module in snake_case.

## Decisions found while building F1 (2026-10-27)

- **The prerendered shell carries no app markup.** TanStack Start's SPA shell renders child routes inside a
  `Suspense` with `ssr: false`. On the client, the router rebuilds those matches after hydration and reads `ssr`
  only from `route.options`, so the first client render did not match the shell (React #418, reproduced in Chrome
  over CDP). The root layout therefore renders everything inside `ClientOnly`: the shell is the document only
  (head, CSS, scripts), and the app renders once on the client. No hydration mismatch, no lost behaviour for an app
  that shows nothing before its session check.
- **CSP without `unsafe-inline`.** Start's shell carries small inline scripts (router bootstrap and stream
  cleanup). `scripts/write_csp.ts` runs after `vite build`, hashes every inline script in `dist/client/index.html`
  and writes `dist/nginx/csp.conf`. The hashes change with the build, and the image carries the matching file. The
  build refuses inline styles. Trusted Types are required with no policy allowed. Checked in Chrome: no violation.
- **The theme is set before first paint** by `public/theme.js` (a stored choice, else `prefers-color-scheme`), a
  same-origin script, because the CSP refuses inline ones.
- **nginx answers `/bff/` with a 404 of its own.** The gateway sends `/bff/` to the edge. If that route is ever
  missing, an HTML page answering a JSON call would read as an unreadable answer, not as the routing fault it is.
- Every route uses `defaultNotFoundComponent` (`src/ui/NotFoundPage.tsx`).

## Sign-in and the session (F2, 2026-10-27)

- **The flow** is `src/features/sign_in/`: a pure reducer (`sign_in_reducer.ts`) over three steps (password,
  challenge, enrolment), one component per step, one BFF call per file in `src/api/calls/`. Every refusal the edge
  documents is handled: `SIGN_IN_REFUSED`, `CODE_REFUSED`, `INVALID_REQUEST`, `SIGN_IN_REQUIRED` and
  `TWO_FACTOR_ALREADY_ENABLED` (back to the password with the reason), `ROLE_REFUSED`, and both 429s, whose
  `Retry-After` holds the button with a countdown. "Use another account" calls `POST /bff/logout` so the edge drops
  the pending sign-in at once.
- **Pending lifetimes** (300 s challenge, 600 s enrolment) are mirrored in `pending_lifetimes.ts` for the countdown
  only; the edge decides, and its `SIGN_IN_REQUIRED` ends the step whatever the clock says. Change them with the
  edge's `config/lifetimes.tl`.
- **The QR code** renders `qrCodeUrl` (an `otpauth://` URI, not an image) with `QRCodeSVG`: React elements, so
  Trusted Types are untouched. It is black on white on purpose (`.qr` in `SignIn.module.css`): scanners need the
  contrast in both themes.
- **Sessions are admins'.** `signedInSchema` requires `role: "admin"`; anything else from the edge is an unexpected
  answer, not a signed-in page.
- **One frame.** The root renders `AppFrame` once; the sign-out button appears when the session query says signed in.
  `_signed_in` guards every page behind it (`beforeLoad`, session cached 30 s) and mounts `SessionWatch`.
- **Session watch.** Two minutes before `expiresAt` it re-reads `/bff/session` (reading does not extend it); if the
  end has not moved, an `alertdialog` counts down with "Stay signed in" (`GET /bff/api/v1/auth/me`, a real use of
  the session) and "Sign out". A signed-out or role-refused failure from any query or mutation sends the page to
  `/sign-in` with the way back in `redirect` (`safe_redirect.ts` admits same-origin paths only). Tabs tell each other
  about sign-outs over a `BroadcastChannel`; messages are parsed, never trusted.
- **Absolute URLs.** `bffRequest` resolves every path against `window.location.origin`, so a call can only reach the
  page's own origin, and the same code runs under jsdom.
- **React Aria and the CSP.** `usePress` injects a `<style>` unless an element with id `react-aria-pressable-style`
  exists: the app stylesheet's `<link>` carries that id and `base.css` holds the same rule. `usePreventScroll`
  (modals on mobile WebKit) injects a fixed style; `scripts/react_aria_style_hashes.ts` hashes it from the installed
  source at build time into `style-src`, and fails the build if React Aria changes it. Driven in Chrome over CDP
  four times after the fix: no violation.
- **CSS Modules are typed.** `bun run css-types` writes `*.module.d.css.ts` (TypeScript's `allowArbitraryExtensions`),
  so a class that does not exist is a compile error; `typecheck` refuses stale declarations (`tcm -l`). Without
  them, `noUncheckedIndexedAccess` makes every class `string | undefined`.
- **No MSW.** MSW 3 does not intercept `fetch` under Bun 1.4.4 (checked in a plain Bun script: "Failed to replace a
  global value", then a real DNS lookup). Tests stub `fetch` with a route table (`tests/support/fake_bff.ts`) that
  records every request and fails the test on any unexpected one.
- **Contract test.** `bin/contract` (CI job `contract`, against `kinetix-docs` on `main`) checks every call in
  `tests/contract/backoffice_calls.ts`: documented method and path through the edge, exactly the documented body
  fields, every documented success parsed by the call's schema, every documented refusal read as a known failure.
  Answers of another app are listed with the reason and must be refused. A wrong path was planted once and caught.
  It copies the docs' `src/` to a temporary directory first: a checkout without `node_modules` (CI's) cannot resolve
  the docs' `tsconfig.json` (`extends: astro/tsconfigs/strict`), and Vite's transform reads the nearest tsconfig.
  The first CI run failed all 28 checks on exactly that.

## Files shared with kinetix-docs

`shared.lock.json` lists the files copied from `kinetix-docs`: the design tokens (`src/styles/kx-tokens.css`), the
two marks and the favicon. Never edit them here. Change them in `kinetix-docs`, then:

```sh
docker compose -f toolchain/compose.yaml run --rm -T \
  -v <path to kinetix-docs>:/docs:ro -e KINETIX_DOCS_DIR=/docs toolchain bun scripts/sync_shared.ts
```

`tests/scripts/shared_files.test.ts` fails on a local edit. CI's `shared` job compares the lock with `kinetix-docs`
on `main` and fails when the docs moved and this repository did not follow.

## Leaks

`scripts/check_leaks.ts` refuses private keys, age keys, JWTs, AWS keys and IPv4 addresses outside loopback and
the documentation ranges, plus every entry of `KINETIX_DENYLIST` (a CI secret, never committed). `bin/ci` runs the
built-in rules; CI's `leaks` job adds the denylist and fails if the secret is empty on a push or on a pull request from
this repository. Dependabot's pull requests get Dependabot secrets only, never Actions secrets, and change only manifests
and lockfiles, so for them (and for forks) the job runs the built-in rules with an empty list, as `kinetix-docs` does;
the secret is not copied into Dependabot's store. GitLab runs gitleaks through the infrastructure template.

## End to end against the lab (`bin/e2e`)

Playwright drives the real lab: gateway, edge, identity and this app (`kinetix-infrastructure` compose, with
`docker compose up -d --build --wait kinetix-api-gateway kinetix-edge-service kinetix-backoffice`).

```sh
KINETIX_INFRA_DIR=../kinetix-infrastructure E2E_API_URL=https://localhost:8443 \
E2E_BASE_URL=https://backoffice.localhost:8443 E2E_IGNORE_HTTPS_ERRORS=1 \
E2E_HOST_RESOLVER_RULES="MAP backoffice.localhost kinetix-api-gateway" bin/e2e
```

- `bin/e2e` registers a fresh customer and a fresh account through identity's API, and promotes the second to
  admin with one SQL `UPDATE` (the one thing the API cannot do, as `kinetix-infrastructure/tests/bootstrap-test-merchant`
  does). Then the suite runs in the Playwright image (`e2e` service in `toolchain/compose.yaml`) on the lab's
  `kinetix` network, so the gateway's staff gate sees a lab address.
- **Chromium resolves `*.localhost` to loopback whatever `/etc/hosts` says**, so `extra_hosts` does nothing; the
  suite maps the host with `--host-resolver-rules` instead.
- **`E2E_IGNORE_HTTPS_ERRORS=1` is lab only:** the lab gateway's certificate names `localhost` and
  `kinetix-api-gateway`, not `backoffice.localhost` (a new lab gateway CA is owed, `BACKOFFICE.md` §8).
- The suite: identity's refusals (wrong password, a customer refused by the edge) shown as words; an admin's
  enrolment with a real TOTP (`otpauth`), sign-in with the next code, the session cookie `HttpOnly`, `Secure`,
  `SameSite=Strict`, no `Max-Age` and unreadable from scripts, sign-out, and no console error or warning.
- **One run at a time, a minute apart:** identity allows 5 sign-in attempts per address per minute and a run makes
  four. Two runs back to back hit the limit; the page then shows the 429 with its countdown, which is correct.

## Not yet here

- ⌘K arrives with F3, when there is something to jump to.
- The first production deploy follows F2 (`BACKOFFICE.md` §8).
