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
0.186.1 (the technical drawings: WebGL 2 first, SVG where there is none, never in the initial load), MapLibre GL JS
6.16.0 with `pmtiles` 4.5.0 and `@protomaps/basemaps` 5.7.2 (F5's street map, same rule), Phosphor icons
2.1.10 (drawn through generated single-weight components, see "Icons"), CSS Modules over the shared tokens
with generated declarations (`typed-css-modules`), TypeScript 7, Biome with the estate's GritQL plugins, Vitest with
jsdom and Testing Library (run under Bun: `bunx --bun vitest`), `axe-core` in the component tests, `@babel/parser` for
the layout check, Playwright 1.64.1 with `otpauth` for the lab E2E. Production is the static build on
`nginxinc/nginx-unprivileged` (pinned by digest), user 101, read-only root.

## Run everything in the toolchain

```sh
bin/dev bin/ci          # install, Biome, layout, CSS-module types + tsc, Vitest, build, bundle budget, leak rules
bin/dev bun scripts/check_layout.ts --fix   # insert the blank lines the house style asks for
bin/dev bun run css-types   # regenerate src/**/*.module.d.css.ts after changing a CSS module
bin/dev bun run icons   # regenerate src/ui/icons/ after changing scripts/icon_set.ts
bin/dev bun run build   # dist/client (the app) and dist/nginx/csp.conf.template
bin/dev bun scripts/sync_map_assets.ts   # re-copy the map's glyphs and sprites from their pinned commits
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
  and writes `dist/nginx/csp.conf` (since F5 `csp.conf.template`, see "F5"). The hashes change with the build, and the
  image carries the matching file. The build refuses inline styles. Trusted Types are required; until F5 no policy was
  allowed, since F5 only the one named `default`, which admits the map's worker URL and nothing else. Checked in
  Chrome: no violation.
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
- **Icons**: Phosphor, regular weight, 18 px by default (`IconDefaults`), `aria-hidden` beside visible text. Since
  2026-10-29 through `src/ui/icons/` only (see "Icons").
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
  the routes' search validation and the shell's new keys. The single-weight icons bought the room back (189.2 KiB,
  "Icons"); the categories' route and sidebar icon took it to 190.7.
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

## Credential checks (seal's predicates, 2026-11-03)

`/seal/predicates` (`src/features/predicates/`) follows `kinetix-docs` `apis/rest/backoffice/predicates`: list,
approve, withdraw. Seal's endpoints were in production (seal v1.7.0) and documented before the screen; `getPredicate`
is not called, because the list holds every live predicate whole.

- **What it shows.** The live checks (seal calls them predicates; the screen says "checks", the user-facing word on
  the verifier page too), sorted by label, each with whether its registry rows are placed yet. A chosen one shows its
  minimums, its freshness window, when it was approved and its two weekly rows (this week's and last week's), each
  with the issue date it asks for and whether the registry holds it. The registry's generation sits above the list;
  while none is active the page says new checks wait for one.
- **Approving** sends exactly the documented body: `class` is always `courier` (the only class seal has), the label
  trimmed, the three minimums and the window. The rating is typed as a rating (4.5 or 4,5, two decimals at most) and
  sent in hundredths. The bounds are seal's (`predicate_rules.ts`: label 1 to 80 printable code points, deliveries up
  to 1,000,000, rating up to 5, days active up to 36,525, window 1 to 365) and are checked before asking; seal still
  decides, and `PREDICATE_EXISTS`, `TOO_MANY_PREDICATES`, `ADMIN_REQUIRED` and `INVALID_REQUEST` are explained with
  seal's words quoted (`predicate_failure.ts`).
- **Placement is not instant.** Seal writes a new check's rows to the registry on its next pass, within about ten
  minutes; while any row is unplaced the list is read again every 30 s (`predicates_queries.ts`), and stops once all
  are placed.
- **Withdrawing** is confirmed in an `alertdialog` with Cancel focused, as deletes are elsewhere. A 404 reads the list
  again: another admin withdrew it first.
- **Keys**: J/K move, N new, W withdraw (`use_page_keys`). No drawing yet; the list and the rows table carry it.
- **Tests**: `tests/predicates/` (the page with axe, the detail and its rows, approve with the rating in hundredths, a
  refusal before asking, a duplicate quoted, withdraw with Cancel focused; the rules). Contract: three calls. Budget
  194.4 KiB of 200 with the route and its sidebar entry. Not seen in Chrome over CDP yet, and not run against the lab.

## Icons (2026-10-29)

Every Phosphor component carries all six weights as React elements in a `Map`, so each icon in the shell cost about
0.8 KiB of the initial load whatever weight was drawn: 13 of them were about 10 KiB of the 197.6. `src/ui/icons/` holds
one component per icon with only the weights the app draws (`scripts/icon_set.ts`: regular everywhere, thin for the
two drawings' fallbacks), written by `bun run icons` (`scripts/generate_icons.ts`) from the installed package's own
definitions (`dist/defs/`, read by file path because the package does not export them) and drawn by Phosphor's
`IconBase`, so `IconContext` (size, weight) works as before. The initial load fell to 189.2 KiB.
`tests/ui/icons.test.tsx` renders every generated icon in every listed weight beside Phosphor's own and requires the
same markup, requires the directory to be exactly the set, and refuses any import of an icon component from
`@phosphor-icons/react` outside it (`IconBase`, `IconContext` and the types stay allowed). A changed path and a
planted import were both caught. A new icon is a line in `icon_set.ts` and `bun run icons`; a Phosphor upgrade is the
same command, and the test says whether anything moved.

## Categories (F4, 2026-10-29)

`/catalog/categories` (`src/features/categories/`) follows `kinetix-docs` `apis/rest/backoffice/categories`: list,
create, rename, delete. No API gap: catalog's five endpoints were in production and documented. `getCategory` is not
called, because the list holds every category with all three fields.

- **One list, one editor.** Catalog answers every category at once, in no guaranteed order, so the page sorts by name
  (`Intl.Collator`, the admin's locale) and filters on the client by name, slug or id. The selection (`selected`) or
  the new form (`creating`) lives in the address, changed with `inPlace` (now `src/ui/in_place.ts`, shared with the
  approvals). The editor is keyed by the category, so choosing another one starts a fresh form.
- **The rules catalog documents** are checked before asking (`category_rules.ts`): a name trimmed, not blank, at most
  128 characters counted as catalog counts them (code points, not UTF-16 units), no NUL; a slug of 1 to 128 ASCII
  letters, digits, hyphens or underscores (`_SLUG` in catalog's `category_service.py`). The name is sent trimmed, as
  catalog stores it. Catalog still decides: its own 400 names the field (`field` is now read into every refusal,
  `read_error_body.ts`), and the page says which field and quotes catalog's words.
- **A new category's slug follows its name** (`slug_of.ts`: NFKD, marks dropped, lower case, runs of anything else
  become one hyphen, cut to 128 without a trailing hyphen) until the admin types in the slug field. Renaming never
  touches the slug.
- **Changing a slug is warned about.** Pricing's category discounts target a slug (`target_category_id`, compared with
  the item's category in `default_discount_evaluator.rs`), so a discount set on the old slug stops applying; the form
  says so as soon as the slug differs. A rename also says that search follows at its next sync (catalog marks the
  products in the same transaction).
- **Refusals.** `CATEGORY_TAKEN` (409) and `CATEGORY_IN_USE` (409, with catalog's sentence naming the count) are
  explained in the admin's language with catalog's words quoted (`<q lang="en">`); `CATEGORY_NOT_FOUND` reads the list
  again, because someone else deleted it. Delete is confirmed in an `alertdialog` with Cancel focused.
- **The cabinet** (`cabinet_model.ts`, `CabinetFigure.tsx`, the user's request for an animation here): the categories as
  a card-catalogue cabinet, one drawer each in the list's order, at most four drawers wide. The chosen one slides out in
  the accent; a new category's drawer drops in, a deleted one lifts away, and the others move to their new places. The
  camera is fitted to the cabinet's shape, so the figure is keyed by columns × rows and starts again only when the shape
  changes. `tests/categories/cabinet_model.test.ts` refuses any two boxes passing through each other.
- **Keys** (`src/ui/use_page_keys.ts`, `src/ui/KeyHints.tsx`, shared with the stock screen; approvals keep their own hook
  and now share `typing_target.ts`): J/K move through the list as filtered, N opens the new form, / goes to the filter,
  D asks to delete the chosen category. Ignored while typing or with a dialog open, like the approvals' keys.
- **Tests**: `tests/categories/` (the page with axe, create, the slug rule, taken, rename and the warning, a category
  deleted by someone else, in use then deleted, the keys; the slug and the rules; the cabinet). Contract: four calls,
  150 checks.
- **Seen in Chrome over CDP** against a stateful stub edge, 1280 light with WebGL, 1280 dark without, 390 dark: list,
  select, the slug warning, create with the slug following, the in-use refusal in the dialog, delete; the sellers'
  page and its tray drawn with the generated icons. No overflow; the one console line is the 409 the stub answers on
  purpose. Not run: the lab E2E.

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

## Stock (F4, 2026-10-29)

`/warehouse/stock` (`src/features/stock/`) follows `kinetix-docs` `apis/rest/backoffice/stock-intake`, written the same
day against warehouse v1.4.0: the bins (`warehouse.listBins`), what each holds (`warehouse.listStock`), booking goods in
(`catalog.getProduct` then `warehouse.receiveStock`), adjusting (`warehouse.adjustStock`), creating and editing bins
(`warehouse.upsertBin`) and the ledger (`warehouse.listReceipts`, `warehouse.listAdjustments`).

- **Keyset paging everywhere**: bins by code (`after`, `nextAfter`, in the address), a bin's rows by id (`after`), the
  ledger newest first (`before`). Warehouse's snake_case is turned into camelCase types in `stock_schemas.ts`.
- **The owner comes from catalog.** Booking in asks catalog for the SKU first and sends that product's
  `merchant_principal_id`; a SKU catalog does not sell (404) or names no merchant cannot be booked. An adjustment takes
  the merchant from its row; a row that names none is refused by warehouse, and the dialog says so before asking.
- **Idempotency keys**: one `crypto.randomUUID()` per dialog, kept across retries until a final answer (a timeout, a 5xx
  or a lost connection says "send it again": the same request is booked once), renewed only after
  `IDEMPOTENCY_KEY_CONFLICT`. Removal is checked against the row's `available` before asking; warehouse's `409` with
  `max_reduction` (the reserve moved first) is shown with that number.
- **Warehouse's refusals** are often `{ "error": "<sentence>" }` with no `message`: `read_error_body.ts` now reads a bare
  `error` as a code when it is upper snake case, else as the message, and every refusal carries the numbers its body
  holds (`numbers`, e.g. `max_reduction`, catalog's `product_count`). Without this the contract test failed every
  warehouse refusal as unreadable.
- **The racks** (`bin_rack_model.ts`, `RackFigure.tsx`): the page's bins as a technical drawing, a rack per zone, shelf
  levels by rank (a level of two billion draws as the next shelf up), a stocked bin tall and an empty one flat; the
  chosen bin slides out like a drawer in the accent. Real data only, still once settled. The painters read the camera
  once, so the camera is fitted to the page's bins when the model is made and the figure is keyed by the page cursor.
  `tests/stock/bin_rack_model.test.ts` refuses any two boxes passing through each other.
- **Keys**: J/K move through the page's bins, B opens booking in and E the bin's edit form for the chosen bin (through
  `BinRequest`, a counter `BinDetail` reacts to), N a new bin, / the SKU finder.
- **Finding a SKU** (`SkuFinder`, `sku` in the address) lists every bin holding it; a bin chosen from there may sit on
  another page of bins, so `BinDetail` works from the code alone and takes the zone and level from its rows.
- **Width at 390, found in Chrome**: Chrome's mobile emulation widens the layout viewport to fit content, so
  `scrollWidth - innerWidth` read 0 while the page was 461 px wide. The cause was the shelf table's visually hidden
  header text: `position: absolute`, its containing block outside `.tableFrame`, so `overflow-x: auto` did not clip it.
  `.tableFrame` is `position: relative` now, and the detail grids are `minmax(0, 1fr)`. Measure `innerWidth` itself.
  The overlays of approvals, categories and stock got `grid-template-columns: minmax(0, 1fr)`, so a modal's
  `width: min(…, 100%)` resolves against the viewport rather than its content.
- **Tests**: `tests/stock/` (the page with axe, a bin's shelf and ledger, booking in with the key and the catalog owner,
  a SKU not on sale, an adjustment over what is free and warehouse's own limit, the SKU finder, a new bin; the rack
  model). Contract: eight calls, 198 checks. Seen in Chrome over CDP at 1280 light with WebGL, 1280 dark with SVG and
  390 dark: every flow, no overflow (by `innerWidth`), no console problem. Not run: the lab E2E.
- **Budget**: 192.5 KiB (the route and two sidebar icons since 190.7). `tests/ui/icons.test.tsx` imports the generated
  icons by path at run time (`@vite-ignore`): Vitest's module cache (`node_modules/.vitest-cache` in the toolchain
  volume) kept the old list of files behind a template `import()`, and four new icons read as unknown.

## When the session ends (2026-10-29)

The user saw "This page could not be shown … Reference: Error" when a session ended, and asked for an animation instead.
The error was a redirect loop, reproduced in Chrome and in `tests/session/session_end.test.tsx`: `SessionWatch` stayed
mounted while the navigation to `/sign-in` was pending, read the pending location (`state.location`, already
`/sign-in?redirect=…`) and navigated again with that as the way back, so each render nested the address once more until
React stopped it (#185, "Maximum update depth exceeded", a plain `Error`); the test also shows the address passing 2048
characters. Now:

- **One way out.** `leaveSession` runs once at a time (a second call joins the first), and every path takes it: a query
  or mutation answered signed-out (`sessionLost` in `router.tsx`), `SessionWatch` reading `authenticated: false`, a
  sign-out in another tab, the sign-out button. The way back is the location the admin was on
  (`state.resolvedLocation`), and nothing leaves from `/sign-in` itself.
- **The session read survives.** After navigating, `leaveSession` removes every query except the session's instead of
  `clear()`: a cleared query cancels its fetch silently, and a silent cancel rejects even with data, which would have
  thrown TanStack Query's `CancelledError` (whose `name` is `Error`) out of `/sign-in`'s `beforeLoad`. The other
  queries still go, so no admin's data stays in the tab for the next sign-in.
- **The animation.** On `/sign-in?notice=session-ended`, from 64rem, the sign-in's figure becomes the account page's
  session fuse (`SessionEndedFigure`): the fifteen idle minutes as a five-by-three grid of cubes, placed at once, which
  lift away one by one in the accent until the pads are empty, then the drawing stops. It starts only when a painter has
  drawn (`Drawing`'s `onDrawn`), because over Tor the three.js chunk can take seconds and the countdown would otherwise
  be over before the first frame. Under reduced motion it shows the empty pads. `sessionFuseModel` gained `columns`,
  `viewHeight` and `show(n, placed)`; the account page's row is unchanged. Seen in Chrome over CDP with WebGL (light) and
  SVG (dark): full at 0.7 s, emptying at 1.4–2.6 s, empty and still at 4.5 s.

## Passkeys (2026-10-29, not released)

The user asked to sign in without opening a phone. Plan and rulings: infra `docs/PASSKEYS.md`. A passkey replaces the
code step after the password; the authenticator code stays always on (the WireGuard face is an IP address, where WebAuthn
cannot work at all, and Tor Browser ships WebAuthn off), so the account page shows it as on with no way to switch it off.

- **Sign-in**: the login answer's `passkeys` (the edge sends it to the backoffice only) puts "Use a passkey" above the
  code when the browser has `PublicKeyCredential`; without WebAuthn the page says the code is the way. The ceremony is
  `@simplewebauthn/browser` 14.0.0, imported on first use so it never reaches the initial load: options from
  `/bff/2fa/passkey/options`, the browser's answer to `/bff/2fa/passkey/verify`. A declined prompt or identity's
  `PASSKEY_REFUSED` leaves the code step open; the edge's pending-ended refusals end it as the code's do.
- **The login answer is parsed strictly** (`login_call.ts`), and `passkeys` is optional there. A backoffice built before
  this refuses the key, so this one must be in production before the edge starts sending it (PASSKEYS.md, "Order").
- **Security on the account page** (`src/features/passkeys/`): the code (on), the passkeys (name, added, last used,
  synced or this device only), add (a name and the password, then the device's prompt) and remove (the password; Cancel
  focused). The password goes with the creation options, before the device makes anything (identity v1.7.1): until
  2026-10-29 it went with the registration, so a wrong one left a passkey in Google Password Manager that identity
  never stored. The browser is told what identity holds through WebAuthn's signal API where it exists (Chrome; not Tor
  Browser): `signalAllAcceptedCredentials` with the list's `credentialId`s each time the list is read (user handle =
  base64url of the principal id, as identity sets it; relying party = the page's host), and `signalUnknownCredential`
  for a credential identity refused (a 4xx, never an outage, when it may have been stored).
- **Tor Browser on a Mac offers a hardware security key only** (seen by the user in production, 2026-10-29: "Touch your
  security key to continue with …", with `security.webauthn.enable_macos_passkeys` already `true`; a browser reaches
  macOS's own passkeys only with a restricted Apple entitlement). Without a key that window waits for nothing, and the
  user did not know what to press. Where `isUserVerifyingPlatformAuthenticatorAvailable()` answers `false`, Security
  says only a hardware key (FIDO2) can be used and the add dialog says to plug it in, enter its PIN, touch it, or press
  Cancel. Where the method is missing the usual words stay. Options and answers are validated with Valibot against the library's JSON types (`exactOptional`, because
  `exactOptionalPropertyTypes` is on).
- **Not in the contract test yet**: the six calls (`edge.passkeyOptions`, `edge.verifyPasskey`, `identity.listPasskeys`,
  `identity.passkeyRegistrationOptions`, `identity.registerPasskey`, `identity.removePasskey`) join
  `tests/contract/backoffice_calls.ts` once the REST reference documents them, after identity and the edge are released.
- **Refusals when adding**: a wrong password, `PASSKEY_LIMIT`, `TWO_FACTOR_REQUIRED`, `PASSKEY_EXISTS` (also caught
  earlier as the browser's `InvalidStateError`, because `excludeCredentials` lists the account's own),
  `PASSKEY_INVALID` and `PASSKEY_CHALLENGE_INVALID` each have their own words; every attempt asks for fresh options.
  The browser's `SecurityError` (the page's host is not the relying party: the WireGuard face in production, the dev
  server on `localhost:3000` in the lab) says the passkey belongs to the backoffice's own address. Until 2026-10-29 it
  read as "could not be created", which the user hit on the dev server; passkeys are tried on the lab's
  `https://backoffice.localhost:8443`.
- **Tests**: `tests/passkeys/` with the library mocked at the module boundary (the device's ceremony cannot run in jsdom).
- **Seen against the lab** (2026-10-29, Chrome over CDP, `WebAuthn.addVirtualAuthenticator` ctap2/internal with user
  verification, `--ignore-certificate-errors` and `--host-resolver-rules` for `backoffice.localhost`): add, sign out,
  sign in with the passkey, the code beside it, remove, and no passkey offered afterwards. React Aria moves the focus
  to Cancel in the remove dialog after the entering animation, about 0.9 s later, not at once. Not seen: Tor Browser.

## Fleet and dispatch, with a street map (F5, 2026-11-09)

`/dispatch` and `/fleet` (`src/features/fleet/`) follow `kinetix-docs` `apis/rest/backoffice/fleet-and-dispatch`, the
ten matching endpoints (`matching.listDrivers`, `getDriver`, `dispatchSummary`, `listDispatches`, `getDispatch`,
`nearbyDrivers`, `assignDispatch`, `unassignDispatch`, `cancelDispatch`, `driverDispatches`), one call file each in
`src/api/calls/`, schemas in `dispatch_schemas.ts`. Plan of record: infra `docs/BACKOFFICE-F5.md` (the user's rulings:
a street map, MapLibre, a fallback without WebGL; Indonesia at z15 in production, Jabodetabek in the lab).

- **The board** (`DispatchPage`, `JobView`): the counts (the Overview's own query and key, so moving between the two
  costs nothing), the jobs newest first with a status filter and keyset paging (`status`, `before`, `job` in the
  address, changed with `inPlace`), a filter over the page by job, order or air waybill number that offers "Open job N"
  for a number not on the page. A job shows its facts, the pickup and drop-off on the map with the line between, the
  straight-line distance (`src/map/distance.ts`, the haversine matching's `geo.ex` uses with the same mean radius,
  6371.0088 km; its documented 0.581 and 1.051 km are the unit test), the timeline matching keeps (created, assigned,
  delivered; picking up has no time in the API), the courier holding it (`getDriver`; a 404 is "not tracked now") with
  their distance to the pickup, and a delivered job's proof of delivery.
- **The fleet** (`FleetPage`, `CourierView`): every tracked courier on the map and in a list (online, busy, offline,
  then by number), duty filter and a number filter; a courier's detail and the jobs they hold (`driverDispatches`), each
  linked to the board. Clicking a courier's marker chooses them; a job's marker opens it on the board.
- **Polling, as `BACKOFFICE.md` §6 set it**: counts and jobs every 15 s (4 a minute each), the fleet's positions every
  10 s (6), through the governor at background priority and only while present. A job's own read, a courier, the
  nearby list and a courier's jobs are read on demand, not polled. The detail follows the list without polling it: when
  the list was read after the job and disagrees on status or courier, the job is read again once
  (`listedAt > job.dataUpdatedAt`, never while a write is in flight). The first version compared without the clock and
  looped forever in a test whose list and detail disagreed; a stale list would have done the same in production.
- **Writes** (`use_job_actions.ts`, `job_cache.ts`, `JobDialog`): each confirmed in an `alertdialog`, Assign focused
  when assigning (A, choose, Enter), "Keep it" focused for unassign and cancel. Assign and unassign are optimistic: the
  job's status and courier change in the detail and in every cached page at once, and a refusal puts the snapshot back
  and says why in words (`job_failure.ts`: `not_found`, `driver_not_found`, `already_assigned`, `driver_not_tracked`,
  `driver_unavailable`, `not_assigned`, `invalid_transition`, `bound_to_order`, `invalid_nearby_query`); a 404 or 409 also
  reads the job and the list again, because someone else moved first. After a 5xx, a 503 or a lost connection the job
  is read again before anything else (the REST reference's step 7): if the change is there it is reported as made, if
  not the page says nothing was done and offers "Try again", which reopens the confirmation; if the job cannot be read
  the page asks to read it before trying again. Cancel is not optimistic, stays in its dialog on a refusal, and is
  offered only for a job with no `order_number` that is waiting or assigned; a job booked by an order says it is
  cancelled with the order. Unassign is offered only for `assigned`, matching's own rule.
- **Assigning** (`AssignPanel`): the couriers matching finds near the pickup (`nearbyDrivers` with the pickup's
  coordinates and a radius of 3, 10 or 25 km, sent explicitly), nearest first with matching's own `distance_km`; only
  an `online` courier has an Assign button, the others say why. The panel says the admin's choice overrides the
  capacity and position-age checks automatic dispatch makes. The nearby couriers are drawn on the map while it is open.
- **Proof of delivery** (`ProofOfDelivery`): the photo is the presigned GET matching answers (`photo_url`, 15 minutes),
  an `<img>` with `referrerpolicy="no-referrer"`; if it fails (expired, refused) the page says so and offers to read
  the job again for a fresh link. The signature is a `data:image/png;base64,…` URI; rather than open `img-src` to
  `data:`, `png_bytes.ts` checks the URI and the PNG signature, `createImageBitmap` decodes the bytes and a `<canvas
  role="img">` draws them on the always-light tile colour (the strokes are dark). Nothing is read back from the canvas,
  so Tor Browser's canvas protection does not interfere.
- **Error bodies**: matching answers `{ "error": "bound_to_order" }` in lower snake case, and Phoenix's own failures
  as `{ "errors": { "detail": … }, "traceId": … }`. `read_error_body.ts` reads both (a lower-case `error` with an
  underscore is a code; a single lower-case word such as `unauthorized` stays a message). The contract test now also
  reads every answer the docs list for any request to matching (`matchingAnswers`) as a known failure; the same check
  over every service found three it cannot read (seal's 500, order's unknown-path 404, warehouse's HTML 400), left
  outside F5 and reported.
- **Keys**: J/K through the jobs or couriers, A assign, U unassign, X cancel, / the filter (`use_page_keys`; A/U/X reach
  the detail through a `JobRequest` counter, like the stock page's `BinRequest`).

### The map platform (`src/map/`, `src/ui/map/`)

- **MapLibre GL JS 6.16.0, pinned exactly, not the latest.** 6.17.0 (2026-11-07) was three days old when F5 was
  built; a dependency this large ships only once a release is at least two weeks old (the coordinator, 2026-11-10), so
  6.16.0 (2026-10-25). Its worker and the API the painter uses are the same as 6.17.0's. The style-spec package that
  validates the style in tests is pinned to 26.4.4, the version 6.16.0 asks for (`^26.4.4`) and older than it, and
  `bun.lock` resolves both to that one copy. Version 6 has no separate CSP build any more: it is an ES module that
  starts its worker as a module worker from a URL (`new Worker(url, { type: "module" })`, same-origin, no blob). The
  worker is bundled by Vite as a hashed asset (`maplibre-gl-worker.mjs?worker&url`, `worker.format: "es"`) and
  handed to `setWorkerUrl`; nginx serves it from `/assets/` as JavaScript, immutable. The painter (`street_map_painter.ts`, with MapLibre, `pmtiles`
  and `@protomaps/basemaps`) is imported only when a map mounts: about 300 KiB gzip, plus the worker's 148 KiB, on the
  F5 routes only. `check_bundle_budget.ts` refuses `maplibregl-canvas-container` and pmtiles' "Invalid PMTiles
  protocol URL" in the initial load. No MapLibre control, popup or marker is used (the attribution control and popups
  write HTML): zoom in, zoom out and "fit" are our own buttons, the markers are GeoJSON circle and symbol layers, the
  attribution is our own caption ("© OpenStreetMap contributors · Protomaps · basemap of <build>"). MapLibre's 70 KB
  stylesheet is not loaded either; `StreetMap.module.css` carries the dozen container rules the map needs.
- **Trusted Types and the CSP.** `worker_policy.ts` creates the policy named `default` once, with only
  `createScriptURL`, which returns the worker's absolute URL and throws a `TypeError` for anything else (another script,
  a `blob:`); no `createHTML` or `createScript`, so every other sink stays refused. The CSP gained `worker-src 'self'`
  and `trusted-types default` (not `'allow-duplicates'`); it still has no `blob:`, `data:`, `unsafe-inline` or
  `unsafe-eval`. MapLibre decodes sprites with `createImageBitmap`, so `img-src` needs no `blob:` either. The worker's
  `eval` and `import()` sit on `importScriptInWorkers`, which is never called.
- **The style is built in code** (`basemap_style.ts`, `basemap_flavor.ts`): `@protomaps/basemaps`' `layers()` with a
  flavour mixed from the tokens (`map_tokens.ts` reads `--kx-bg`, `--kx-fg`, grays, lanes and accent; `color_mix.ts`):
  paper earth, roads as ink at rising shares by class, water and parks a faint mix of the two lanes, labels in the
  grays with paper halos. No POI layer (the flavour has no `pois`), the accent never in the basemap, only on our own
  places (the selected job's line, a chosen courier). Labels follow the admin's language (`lang` `en`/`id`). A theme
  change (the `data-theme` attribute, watched by a `MutationObserver`) re-reads the tokens and `setStyle(…, { diff: true
  })`; the sprite switches between the grayscale and black sets.
- **Glyphs and sprites are ours**, served from `/map/<version>/`. `@protomaps/basemaps-assets` is not an npm package
  (the brief said it was): it is the GitHub repository `protomaps/basemaps-assets`, so `scripts/sync_map_assets.ts`
  copies the files from a pinned commit (and the sprites' MIT licence from `tangrams/icons`, pinned too) into
  `public/map/<version>/`, where `version` is the first 12 hex of a SHA-256 over the files' hashes, and writes
  `map_assets.lock.json`; `tests/map/map_assets.test.ts` refuses a changed file or a stray one. Only what labels need:
  Noto Sans Regular, Medium and Italic, ranges 0-255, 256-511 and 8192-8447, plus Arabic (1536-1791) for Regular (the
  second line of a name in another script); the grayscale and black sprites (arrow, town spot, capital, shields), since
  without POIs the colour sets' icons are never drawn. 972 KB in the image; a browser fetches only the ranges in view.
  Scanning every name in the Jakarta extract found 0-255 (1.18 M characters), 8192-8447 (402), Arabic (46), Cyrillic
  (12), Latin Extended Additional (5) and a few Thai, Tamil, Malayalam and Myanmar characters: those rare ranges are
  missing on purpose and MapLibre leaves the characters out. CJK is drawn locally by MapLibre
  (`localIdeographFontFamily`). Because the directory name changes with the content, nginx serves `/map/` as
  `public, max-age=31536000, immutable`: a repeat visit asks for nothing, which matters because `/map/` rides the app's
  route and its 100 a minute shared by every onion visitor (the gateway's note, 2026-11-09).
- **Tiles**: `pmtiles://<origin>/tiles/basemap.pmtiles/{z}/{x}/{y}` through the `pmtiles` protocol (range requests,
  strong ETag, re-read on an ETag change). The source's `maxzoom` and `bounds` come from the manifest, so MapLibre asks
  no TileJSON and the archive's header is read with the first tile. The view opens on the manifest's `bbox`;
  `maxBounds` is that box plus a quarter of its span each side, widened when a place lies outside.
- **The manifest** (`basemap_manifest.ts`) is infra's `kinetix basemap fetch` output, parsed strictly: `build`
  (ISO date), `source` (URL), `bbox` (`[west, south, east, north]`, west < east and south < north), `maxzoom`, `bytes`,
  `sha256` (64 hex), `written_at` (ISO instant). A 404 is "no basemap on this server": the grid drawing shows with that
  sentence, not an error. Anything else that is not that shape (the app's page, another body, a 5xx) says the
  description could not be read, with the status.
- **Without WebGL 2** (`supportsWebgl2` in `src/ui/webgl2.ts`, shared with `Drawing`), or if MapLibre throws, the
  map's place shows `PlaneMap`: the same places and lines on an equirectangular latitude/longitude grid at a round step,
  labelled in the admin's language (`6.20° S` or `6,20° LS`), with a distance scale whose length is measured with the
  haversine, and the sentence on how to get streets (`webgl.enable-webgl2` in Tor Browser's `about:config`, or Chrome).
  The grid drawing asks for nothing: no manifest, no tiles, no glyphs. `plane_model.ts` is plain arithmetic and unit
  tested (north up, east right, every point inside the margin, the scale's length is the distance it names). With no
  position at all it says so instead of inventing a centre.
- **`data-renderer`** on the map's `figure` says which drew (`webgl`, `svg`), as the drawings' frames do.

### Serving it (`nginx/`, `Dockerfile`)

- `location = /tiles/basemap.pmtiles` and `location = /tiles/basemap.json` alias the two files of the read-only volume
  at `/srv/tiles`, with `Cache-Control: no-cache`, nginx's ETag and byte ranges, as `application/vnd.pmtiles` and
  `application/json`; every other path under `/tiles/` is a JSON 404, and the `~ /\.` rule keeps refusing the fetch's
  `.basemap.*.partial` files. A missing volume or file is a 404, never the SPA page (the gateway's conformance test
  tells the two apart). `.pmtiles` is not in `gzip_types`: a range over a gzipped body breaks PMTiles.
- `location /map/` serves the versioned assets immutable with `try_files $uri =404`, so a missing glyph range is a 404
  rather than `index.html`.
- **The CSP is rendered at container start.** `write_csp.ts` writes `dist/nginx/csp.conf.template` with
  `img-src 'self' ${KINETIX_STORAGE_ORIGIN}` and refuses any other `$` in the policy. The image keeps nginx-unprivileged's
  entrypoint (`ENTRYPOINT ["/docker-entrypoint.sh"]`, `CMD nginx`): `05-kinetix-storage-origin.sh` exits 1 unless the
  variable is a bare origin (`http(s)://host[:port]`, nothing else, so it cannot add a directive or a quote), then
  `20-envsubst-on-templates.sh` renders `/etc/nginx/templates/kinetix/csp.conf.template` into `/tmp/kinetix/csp.conf`
  (`NGINX_ENVSUBST_OUTPUT_DIR=/tmp`, `NGINX_ENVSUBST_FILTER=KINETIX_STORAGE_ORIGIN`), the tmpfs the read-only root
  already has. `headers.conf` includes that file; if it were missing nginx would refuse to start. Checked: without the
  variable and with `http://… data:` the container exits 1. CI's `image` job runs the image with
  `KINETIX_STORAGE_ORIGIN=https://storage.example.invalid`, requires `img-src 'self' https://storage.example.invalid;`
  in the header and a 404 for `/tiles/` without the volume, and requires a refusal naming the variable for an empty
  value, `http://… data:` and a value without a scheme. The first F5 push went red there (2026-11-10): the job still ran
  the image without the variable, so the container exited and `/healthz` never answered.
- **The lab's storage origin is plain http** (`http://localhost:9000`, the object store's public URL presigned links
  name), on an https page. Chrome upgrades mixed passive content: the photo is asked for as `https://localhost:9000/…`,
  which nothing serves, so in the lab the proof's photo shows "could not be shown" while production's https storage
  host shows it. Nothing is loosened for the lab.

### Tests and evidence

- `tests/fleet/` (the board with axe; status and the older page; a job on the grid drawing with its distance; assign with
  A, the busy courier not choosable, the optimistic status, the body `{ driver_id }`; a refusal rolled back in words and
  the job read again; a 503 that was made; a 500 that was not, with "Try again"; unassign with "Keep it" focused;
  `bound_to_order` in the dialog; cancel; the delivered job's photo and drawn signature; J/K; a job matching does not
  have, opened from the filter; the detail read again once, not in a loop; the fleet with axe, a courier and their jobs,
  the filters, a courier not tracked), `tests/map/` (distance, the plane model, the style valid by MapLibre's own
  `validateStyleMin` in both themes and languages and coloured from the tokens, the manifest, the worker policy, the
  asset lock, the street map's fallbacks: no WebGL, no basemap, an unreadable manifest, MapLibre failing, and the street
  state with the painter mocked). 280 tests. Contract: thirteen calls more than before, 271 checks; a wrong path and an
  extra body field were planted and caught.
- `tests/approvals/approvals_pages.test.tsx`'s counts test pins its clock to a Wednesday: on a Monday (UTC, the
  toolchain's zone) today and this week start together, the stub answered both with the week's numbers, and the test
  failed on 2026-11-09.
- **Budget**: 196.1 KiB of 200 (from 194.4): two sidebar icons and the two routes' search validation. The status
  picklist is written in `fleet_search.ts` rather than imported from `dispatch_schemas.ts`, which would have pulled
  every job and courier schema into the initial load.
- **Seen in Chrome 157 over CDP** (with 6.17.0; once more with 6.16.0, below) against a stateful stub edge (Bun, in a
  container) in front of the production image
  itself (read-only root, tmpfs `/tmp`, the variable set, a 13 MB extract of central Jakarta at z15 cut from the
  Protomaps build of 2026-11-08 with go-pmtiles 1.31.2, mounted at `/srv/tiles`), so nginx's ranges, ETags, types and
  the rendered CSP were the real ones, with Trusted Types enforced:
  - 1280 light, WebGL: the board, a job on the street map (3 range requests for tiles, 6 for `/map/`: two sprite files,
    four glyph ranges, then nothing on a repeat), A, the busy courier without a button, a refused courier rolled back
    to Waiting in words, a courier assigned, U with "Keep it" focused, X and cancel on an unbound job, the delivered
    job's photo (480×320 from the storage origin) and signature drawn, the fleet with a courier and their job;
  - 1280 dark, WebGL: the fleet and a job in charcoal, then the theme switched to light at run time (the style
    re-coloured, the black sprite swapped for the grayscale one);
  - 1280 with `--disable-3d-apis`: the grid drawing on the board and the fleet, the sentence, and not one request to
    `/tiles/` or `/map/`;
  - 390 dark: the job, the assign panel, the fleet and the board;
  - every setup: `scrollWidth` equal to `innerWidth`, no `securitypolicyviolation`, no exception; the one console line
    is the 409 the stub answers on purpose.
- **Seen against the lab's basemap** (2026-11-10): `kinetix-backoffice` rebuilt and recreated from the infrastructure
  checkout (`docker compose up -d --build --wait kinetix-backoffice`), with the `kinetix_basemap` volume (Jabodetabek
  z15, build 2026-11-09, 140 MB) read-only at `/srv/tiles` and `KINETIX_STORAGE_ORIGIN` rendered into its CSP. Through
  the gateway's TLS face: the manifest, a range of the archive (206, `application/vnd.pmtiles`, strong ETag,
  `no-cache`), a sprite, and a 404 for any other path under `/tiles/`. In Chrome, the stub edge in front of that
  container (sessions and matching are the stub's; the lab's own admin sign-in was not driven): the board's job and the
  fleet on the real Jabodetabek streets, light and dark, caption "basemap of 2026-11-09", 31 tile ranges and 6 to 8
  `/map/` files, no violation, no console problem. The lab gateway still answered `/tiles/` with the app route's
  `X-RateLimit-Limit-Minute: 100` that day, not the map's own budget.
- **Again with MapLibre 6.16.0** (2026-11-10), the lab container rebuilt with it and the stub in front: the job's map in
  dark on the Jabodetabek basemap (the worker `maplibre-gl-worker-*.js` loaded as a module worker, 11 tile ranges), the
  theme switched to light at run time (grayscale sprite fetched, style re-coloured), the fleet in WebGL, and with
  `--disable-3d-apis` the grid drawing with its sentence and no request to `/tiles/` or `/map/`. No violation, no
  console problem, no overflow. Map chunk 299.7 KB gzip, worker 147.6 KB.

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
- **Since 2026-10-30 the onion face is HTTPS** from our own CA (infra `docs/BACKOFFICE-ONION-TLS.md`): `E2E_BASE_URL` is
  `https://<the lab's onion address>`, and Firefox needs the lab CA (`pki/onion/ca.crt` in the infrastructure checkout) or
  `E2E_IGNORE_HTTPS_ERRORS=1`; plain `http://` now answers 308. The Firefox preferences above were for the plaintext face;
  this run has not been repeated since.
- **Slower timeouts** through Tor: 180 s a test, 30 s an expectation.
- **The test waits for "You are signed out." before leaving the page.** Sign-out lands on `/sign-in`, whose
  `beforeLoad` reads the session; through Tor that takes a second, and Firefox rejects a fetch still in flight when the
  page unloads, which the error boundary logs from the page being left (React's `onCaughtError`). Chromium drops such
  a fetch silently. Not a fault a person sees, but the suite's no-console-problem check would.
- First run 2026-10-28, both tests green through the real Tor network; the same suite on the TLS face in Chromium
  stayed green. A Tor client without the key cannot connect at all (`curl` through it: SOCKS5 refused).

## Not yet here

- ⌘K jumps between the screens that exist (the two queues, the categories, the board and the fleet included) and
  switches theme and language; lookups of an order, a job, an application or a SKU by id are not built yet (the board's
  filter opens a job by number).
- Live updates over a WebSocket (X21) instead of polling the board and the fleet.
- A reason with a rejection: identity stores none, for sellers or couriers (infra `BACKOFFICE.md` §7.2).
