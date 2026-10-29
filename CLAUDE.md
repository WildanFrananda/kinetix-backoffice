# CLAUDE.md — kinetix-backoffice

The staff web app, the one operator UI for every Kinetix service. It has no public name: staff open it as a Tor onion
service with client authorization, or over the staff VPN when Tor misbehaves, and the app works the same on both
because it only ever calls its own origin. Plan of record: `kinetix-infrastructure/docs/BACKOFFICE.md` (rulings
BO-D1–D10, API gaps §7, order of work §8, onion-only access §10). This repository is public: never commit the onion
address, staff ranges, addresses, server names or anything from the infrastructure repository.

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
TanStack Router, Query and Form, React Aria Components, Valibot, `qrcode.react`, Motion 14.2.0 (animation), Three.js
0.186.1 (the technical drawings: WebGL 2 first, SVG where there is none, never in the initial load), Phosphor icons
2.1.10, CSS Modules over the shared tokens
with generated declarations (`typed-css-modules`), TypeScript 7, Biome with the estate's GritQL plugins, Vitest with
jsdom and Testing Library (run under Bun: `bunx --bun vitest`), `axe-core` in the component tests, `@babel/parser` for
the layout check, Playwright 1.64.1 with `otpauth` for the lab E2E. Production is the static build on
`nginxinc/nginx-unprivileged` (pinned by digest), user 101, read-only root.

## Run everything in the toolchain

```sh
bin/dev bin/ci          # install, Biome, layout, CSS-module types + tsc, Vitest, build, bundle budget, leak rules
bin/dev bun scripts/check_layout.ts --fix   # insert the blank lines the house style asks for
bin/dev bun run css-types   # regenerate src/**/*.module.d.css.ts after changing a CSS module
bin/dev bun run build   # dist/client (the app) and dist/nginx/csp.conf
bin/dev down            # remove the toolchain's volumes
KINETIX_BFF_TARGET=https://localhost:8443 bun run dev   # on the laptop: hot reload against the lab's edge
```

`vite.config.ts` passes `/bff/` to `KINETIX_BFF_TARGET` with the Host and Origin of the lab's backoffice
(`KINETIX_BFF_FACE`, `https://backoffice.localhost:8443` by default), so Kong routes it and the edge's `Origin` check
accepts it; without the variable there is no proxy. The full procedure, the lab admin and the other two ways to look
(the production build in the lab, the lab's onion in Tor Browser) are `kinetix-docs-internal`
`operations/backoffice-local`.

Nothing is installed on the laptop by the toolchain: its `node_modules` lives in a Docker volume. The host's
`node_modules/` is the IDE's, installed by the user with `bun install --frozen-lockfile`; after a dependency changes
the IDE shows "Cannot find module" until that is run again, and the toolchain never reads it.

## Code style (the estate's TypeScript rules)

- `type` for shapes, one per file in `src/types/*.type.ts`; `interface` only where TypeScript requires one
  (`src/types/register.d.ts`, the router's module augmentation).
- Functions are declared with `function`; an arrow only as an anonymous callback. Exports at the bottom of the file.
  Both are enforced by `biome-plugins/*.grit`, copied from `kinetix-seal-service`.
- No comments; the reasoning lives here.
- Code is never compact: a blank line after a multi-line statement or a closing brace before the next statement,
  before a `return` that ends a block of more than two lines, and between an `if`/`for`/`while`/`switch` and a line
  above it that it does not read. An assignment stays above the check that reads it. No blank line just inside a
  block's braces. `scripts/check_layout.ts` (Babel's parser, rules in `scripts/layout_rules.ts`, tests in
  `tests/scripts/layout_rules.test.ts`) enforces it in `bin/ci`, and `--fix` only inserts or removes blank lines.
  Biome's formatter keeps them, so run the fix, then `biome format`, and the two settle in one pass.
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

## The visual and platform foundation (F2b, 2026-10-28)

The user asked for animation, 3D and icons, "jangan polosan", and for the advanced fundamentals beyond the UI. The look
stays the docs' (`BACKOFFICE.md` §5): no gradient, glow, pill or hover lift. What was added, and why each piece is so:

- **Shell** (`src/ui/shell/`): a sidebar (`Sidebar`, `navigation.ts`) with only the screens that exist, a top bar with
  the ⌘K trigger and the language and theme toggles, a drawer below 64rem (`MobileNavigation`), a skip link, and a
  route announcer that focuses the page's `h1` and reads it out. React Aria restores focus to the opener when an overlay
  closes, after its exit animation, so the announcer focuses again at 400 ms if focus ended outside `main`.
- **Command palette** (`CommandPalette`, `palette_groups.ts`): React Aria `Autocomplete` in a modal. A `SearchField`
  spends the first Escape on clearing its text; a `TextField` with `<input type="search">` keeps the searchbox role and
  closes on the first Escape (`tests/shell/app_shell.test.tsx`).
- **Overview** (`src/features/overview/`): five documented endpoints, each panel inside its own boundary, a dash and
  never a zero until a figure has been read, the spoken value apart from the counting animation. Returns show in a
  full-width panel from the same query as the attention figures, so no request is added.
- **Motion** (`src/ui/motion/`): `LazyMotion` loads its features after the first render (`motion_features.ts`), and
  `MotionConfig reducedMotion="user"`. Overlays (palette, drawer) animate with CSS on React Aria's
  `data-entering`/`data-exiting`, which React Aria waits for before unmounting.
- **Icons**: Phosphor, regular weight, 18 px by default (`IconDefaults`), `aria-hidden` beside visible text.
- **3D** (`src/three/`, `src/ui/drawing/Drawing.tsx`): the sign-in shows a technical drawing, a rack with parcels in
  ink lines, exploded then assembled, turning slowly; static under reduced motion. It loads only at 64rem and wider,
  after the form, and stops drawing out of sight. **WebGL 2 first, SVG when the browser has none** (the user,
  2026-10-28: *"gapapa pake WebGL2, biar optimize, tapi fallback nya … pake yang solusi kamu sekarang"*; WebGL 2 is
  allowed for later screens too, always with such a fallback). Since F3 a drawing is a **model** and two **painters**:
  a model (`DrawingModel`: camera, floor, and `frame(seconds)` returning boxes, a turn and whether it has settled, plus
  `subscribe` for changes) knows nothing of WebGL or SVG and is plain arithmetic, so it is unit-tested
  (`rack_model.ts` for the sign-in, `features/approvals/tray_model.ts` for F3). `Drawing` probes for a WebGL 2 context
  and loads `webgl_painter.ts` (Three.js `WebGLRenderer`, fat lines from `LineSegments2` over paper-coloured faces,
  one shared unit box scaled per piece so no geometry is made per frame, colours read from the theme's tokens and
  re-read when the theme changes); if there is none, or the renderer throws, it loads `svg_painter.ts`: Three.js does
  the camera and the projection, and SVG `<path>`s are painted, each box showing only the faces that turn toward the
  camera and the boxes ordered back to front by an AABB separation test (`box_geometry.ts`, tested in `tests/three/`).
  The SVG's colours are CSS classes over the tokens, never a `style` attribute, which the CSP refuses (three's own
  `SVGRenderer` sets one, so it is not used). Both painters share `drawing_loop.ts`: frames run only while the drawing
  is on screen and the model has not settled, and a model's change wakes them, so a still drawing costs nothing.
  `data-renderer` on the drawing's frame (`webgl` or `svg`) says which one drew. Why the fallback matters: Tor Browser,
  the staff's main client, keeps WebGL 2 off by default (fingerprinting; Mozilla's bug to drop the pref was closed
  WONTFIX) and blocks WebGL at its Safer level, and Three.js has rendered only with WebGL 2 since r163; the first
  version showed only the fallback mark there. Checked on 2026-10-28: Chrome draws with WebGL; Firefox with WebGL 2
  off, with WebGL off, and with `resistFingerprinting` on draws the SVG; Chrome with `--disable-3d-apis` draws the
  approvals' SVG. Not checked: Tor Browser with `webgl.enable-webgl2` switched on, because headless Firefox in the
  toolchain has no GL driver; if Tor Browser's minimum-capability mode makes the renderer throw, the SVG takes over.
  Chunks: the shared Three.js core about 49 KiB gzip, the WebGL painter about 90 KiB, the SVG painter 2 KiB; none may
  reach the initial load (the budget script refuses `isOrthographicCamera` and `WebGLRenderer` there). The same pair
  will draw F4's racks.
- **Budget**: `scripts/check_bundle_budget.ts` sums the gzip size of every script the built `index.html` loads or
  preloads, 200 KiB at most (192.6 KiB on 2026-10-28). It forced three choices: the root's error and not-found pages
  are lazy (they pulled the public frame's controls into the main chunk), the palette and the drawer load on first use
  (with an idle prefetch of the palette), and theme and language are segmented toggles, because React Aria's
  `Menu` + `Popover` cost 43 KiB.
- **Request governor** (`src/api/request_governor.ts`, `governor.ts`): every BFF call takes a slot in a sliding window of
  80 a minute, shared by the tabs over a `BroadcastChannel`; interactive calls go before polls. Kong's per-address 429
  (it carries `X-RateLimit-Limit-Minute`) holds every tab until `Retry-After`, with a banner and a countdown; a route's
  own 429 (identity's throttles) stays that call's failure (`failure_of.ts`, `scope`).
- **Presence** (`src/api/presence.ts`): polling runs only while the tab is visible and there was input in the last five
  minutes. The edge counts every `/bff/api` call as activity, so polling an unwatched page would keep an admin session
  alive for its whole eight hours.
- **Retries and connectivity**: queries retry a lost connection or an unavailable upstream twice (1 s, 3 s) and nothing
  else (`retry_policy.ts`); a banner says offline or unreachable (`connectivity.ts`).
- **Error bodies**: besides the edge's and Kong's, identity's Nest list of messages and order's problem details are
  read; a 401 or 403 with no body is a refusal, any other body-less 4xx stays unreadable, never a business answer.
- **Tests**: axe on the overview and the shell (`tests/support/axe.ts`; contrast is left to the browser runs), the
  palette end to end through a memory router, the governor across two real `BroadcastChannel`s. jsdom has no
  `matchMedia` or `scrollIntoView`; `tests/setup.ts` gives a `matchMedia` that matches nothing and a `scrollIntoView` that
  does nothing.
- **Seen in Chrome over CDP** against a stub edge (1280 light and dark, 390 dark): no CSP or Trusted Types violation,
  WebGL drawn, no horizontal overflow, focus on the `h1` after every navigation. A stub that reads `csp.conf` at start
  must be restarted after a build, or the new inline-script hashes are refused and nothing renders.

## Approvals (F3, 2026-10-28)

`/approvals/sellers` and `/approvals/couriers` (`src/features/approvals/`) follow `kinetix-docs`
`apis/rest/backoffice/seller-applications` and `courier-applications`: the list, the applicant's profile, approve,
reject (couriers too since identity v1.6.0 and the REST reference's re-pin, 2026-10-29), and the counts of decisions.
The user asked for the sign-in's Three.js animation here too and a UI "yang indah"; the `ui-ux-pro-max` skill was
consulted for the queue, the confirmation and the motion rules.

- **One queue page, two queues.** `useApprovalQueue` holds what both share: the selection (from the address, else the
  oldest), J/K/A/R (`use_queue_keys.ts`; ignored while typing or in a dialog), the confirmation, the mutation and what
  follows it. `SellerApprovalsPage` and `CourierApprovalsPage` supply the list query, the decision call and the
  detail. Status, cursor and selection live in the URL (`approvals_search.ts`, `searchWith` keeps it short), and every
  such change navigates with `inPlace` (`replace`, `resetScroll: false`): TanStack Router scrolls the window to the top
  on every navigation, a search-only one included, so choosing an application used to throw the admin back to the
  page's top (the user, 2026-10-29). Below 64rem choosing one scrolls to its detail instead, which sits under the list.
- **Decisions.** Every approve or reject is confirmed in an `alertdialog`: Approve has the focus when approving (A then
  Enter is the keyboard path), Cancel when rejecting. A success removes the application from the cached page (the
  server has decided; nothing is optimistic), moves to the next one, and invalidates the queue and the Overview's count.
  A refusal stays in the dialog in identity's own words (`<q lang="en">`) and the list is read again, because a 404 or
  409 means someone else decided first. `decision_failure.ts` names the documented courier cases: `NO_DRIVER_RECORD`,
  a 503 with a `FLEET_*` code (the account is a courier, approve again) and a 502 with the fleet's code (nothing
  changed); the edge's own codes on those statuses are never read as the fleet's. An approved seller whose store was
  not geocoded (no `latitude`/`longitude` in the answer) is told so: no courier can be sent there yet.
- **The tray drawing** (`tray_model.ts`, `TrayFigure.tsx`): an in-tray holding one sheet per waiting application on the
  page (oldest on top, at most 20 drawn), the selected one pulled out in the accent, and one out-tray per outcome the
  queue has; a decision flies its sheet to its tray. It is real data and moves only when the data does: it settles
  and stops drawing, there is no idle loop (the skill's rule against decorative infinite animation). Both queues have
  an approved and a rejected tray. The drawing shows from 64rem; the legend under it shows at every width.
  `tests/approvals/tray_model.test.ts` refuses any two boxes passing through each other once settled, which is what the
  SVG painter's AABB ordering needs; it caught a selected sheet in a short queue lifted into the tray's front wall.
- **Counts of decisions** (`use_decision_tallies.ts`, `period_starts.ts`). The user asked for today, this week and this
  month instead of "on this visit", kept across sign-outs, and ruled (2026-10-29) that identity counts: one
  `GET …/applications/tally?since=` per period, `since` being the period's start in the admin's own time zone (local
  midnight, Monday, the first of the month; Monday for every locale, because `Intl.Locale` week info is missing in
  Firefox and so in Tor Browser), sent as UTC with `Z`. Identity counts the applications as they stand now. A decision
  adds one to every period's cached count at once (`setQueriesData`); the counts are read again only every five minutes
  and on mount, never after each decision, because identity's courier controller allows 10 requests a minute per
  address and approving several couriers in a minute would otherwise spend it. A decided list (approved, rejected)
  asks for no count. Tally keys sit apart from the queue's (`["bff", "approval-tallies", …]`), so invalidating a queue
  does not refetch them. Shown as a table: periods across, outcomes down, each period's first day under its name.
- **Profiles** are read only after the selection rests 350 ms (`use_settled.ts`), so J held down does not spend the
  request budget; a 404 is "no profile saved", which the docs define as an answer about the profile, not the
  application.
- **Feature catalogues.** The approvals' 84 strings are `src/catalogue/approvals/{en,id}.json`, merged over the shell's
  by `featureCatalogues` (`src/i18n/feature_catalogues.ts`) into `useApprovalsText`, and loaded with the route's chunk;
  the account page's are `src/catalogue/account/` the same way. In the shell's catalogue they cost about 4 KiB of the
  initial load in two languages; the budget stood at 199.1 KiB with them there. A later feature does the same.
- **Budget**: 197.0 KiB of 200 on 2026-10-28 (from 192.6; 197.6 on 2026-10-29): two sidebar icons (Phosphor ships all six weights per icon),
  the routes' search validation and the shell's new keys. Headroom is about 3 KiB; each later screen adds a sidebar
  icon and a route, so F4 should expect to buy room (a single-weight icon set, or the sidebar's icons lazy).
- **Contract.** Calls with path values are checked against the documented template (`{id}` matches one segment) and
  must fill every documented path field (`tests/contract/endpoints.test.ts`); a wrong path was planted and caught.
- **The page tests and the request governor.** `governor.ts` is one module-level window of 80 requests a minute, so a
  test file that renders many pages in a row runs out of it, and later tests wait for a slot until they time out (the
  counts' three calls a page did that to the courier tests). `approvals_pages.test.tsx` replaces the module with a
  governor without a limit; the budget itself is tested in `tests/api/`.
- **Seen in Chrome over CDP** against a stateful stub edge, 1280 light and dark with WebGL, 1280 with
  `--disable-3d-apis` (SVG, 73 paths), 390 dark: list, J/J, approve with Enter, the flight, the notice, the reject
  dialog with Cancel focused, couriers, a decided list, the Overview; no overflow, no CSP violation or exception (the one
  console line is the profile 404 the stub answers for an applicant without a profile). Not run: the lab E2E. Again on
  2026-10-29 with the counts and the courier reject, same four setups: the counts move at once on a decision (a seller
  approval 2/4/8 to 3/5/9, a courier rejection 0/0/1 to 1/1/2), the rejected sheet lands in the right-hand tray (SVG,
  58 paths for couriers), a rejected courier reads "Rejected … ago", no overflow at 390.

## The account page (2026-10-29)

The user asked for it to be made beautiful, with a 3D drawing too, and then for the identity to be "kartu pengenal" with
animation. `IdentityCard` is a staff badge in HTML, not WebGL, so its text stays real, selectable and read out: it
arrives in 3D (CSS perspective, Motion's spring), tilts toward a mouse pointer and shows its edge (a back plate at
`translateZ(-9px)`), never under reduced motion or touch. The monogram, the guilloche of ink lines
(`badge_lines.ts`, no gradient) and the two machine-readable lines, printed from the account's own role, principal
and id, are `aria-hidden`; the lines are sized in container units so 44 characters always fit. Beside it, the session: a live countdown, its end, "Stay signed in" (`GET
/bff/api/v1/auth/me`, a real use of the session, then a fresh read of `/bff/session`) and sign-out. The drawing
(`session_fuse_model.ts`) is that session as fifteen slots, one per minute of the backoffice's idle limit, with a cube
on each minute left: each minute the last one lifts away in the accent, and an extension drops cubes back in; between
changes it is still. `session_lifetimes.ts` mirrors the edge's `config/lifetimes.tl` (900 s idle, 8 h absolute) for
the drawing and the sentence only; the edge decides, and `expiresAt` is the truth. The page re-reads `/bff/session`
once a minute while the admin is present (reading it does not extend it). Shown from 48rem. Tests:
`tests/session/session_fuse_model.test.ts` (no two boxes pass through each other), `account_page.test.tsx` (axe, the
stay flow). Tweening moved to `src/three/moving_piece.ts`, shared with the tray.

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

### Through Tor, on the onion face (2026-10-28)

The backoffice is reached as an onion service with client authorization (infra `docs/BACKOFFICE.md` §10). The same
suite runs through it in Firefox when `E2E_TOR_PROXY` is set (the `firefox-onion` project in
`e2e/playwright.config.ts`). The lab needs `kinetix-tor` up beside the gateway, the edge and this app, and a Tor client
on the lab network holding a lab client key (`bin/kinetix onion client add dev <name>` in the infrastructure
repository prints its auth line):

```sh
docker volume create kxlab-onion-auth
docker run --rm -v kxlab-onion-auth:/auth -v <dir holding lab.auth_private>:/src:ro alpine:3.22.2 \
  sh -c 'install -o 100 -g 101 -m 600 /src/lab.auth_private /auth/ && chown 100:101 /auth && chmod 700 /auth'
docker run -d --name kxlab-tor-client --network kinetix -v kxlab-onion-auth:/auth --entrypoint tor kinetix-kinetix-tor \
  --SocksPort 0.0.0.0:9050 --SocksPolicy "accept *" --ClientOnionAuthDir /auth --DataDirectory /tmp/tor-client
KINETIX_INFRA_DIR=../kinetix-infrastructure E2E_API_URL=https://localhost:8443 \
E2E_BASE_URL=http://<the lab's onion address> E2E_TOR_PROXY=socks5://kxlab-tor-client:9050 bin/e2e
```

- **Firefox is set up as Tor Browser is.** `dom.securecontext.allowlist_onions` makes `http://…onion` a secure
  context, so the edge's `__Host-kx_session` (`Secure`) is kept; `network.proxy.socks_remote_dns` lets Tor resolve the
  address. `security.mixed_content.upgrade_display_content` is off because upstream Firefox (since 127) rewrites the
  page's own `http://…onion` images to `https` and they break; Tor Browser hit exactly this in 14.0a1 and exempts
  `.onion` from the upgrade (tor-browser#43012, merge request 1116). Without it the marks and the favicon fail.
- **Slower timeouts** through Tor: 180 s a test, 30 s an expectation.
- **The test waits for "You are signed out." before leaving the page.** Sign-out lands on `/sign-in`, whose
  `beforeLoad` reads the session; through Tor that takes a second, and Firefox rejects a fetch still in flight when the
  page unloads, which the error boundary logs from the page being left (React's `onCaughtError`). Chromium drops such
  a fetch silently. Not a fault a person sees, but the suite's no-console-problem check would.
- First run 2026-10-28, both tests green through the real Tor network; the same suite on the TLS face in Chromium
  stayed green. A Tor client without the key cannot connect at all (`curl` through it: SOCKS5 refused).

## Not yet here

- ⌘K jumps between the screens that exist (the two queues included) and switches theme and language; lookups of an
  order, a job, an application or a SKU by id are not built yet.
- A reason with a rejection: identity stores none, for sellers or couriers (infra `BACKOFFICE.md` §7.2).
