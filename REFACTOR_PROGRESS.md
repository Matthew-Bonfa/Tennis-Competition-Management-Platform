# Frontend Refactor — Progress

Branch: `feature/frontend/refactor`
Scope: visual + structural refactor of `frontend/` only. No functional, route, API, state or
copy changes. Verification per phase: `npm run build` and `npm run lint` in `frontend/`.

**Next step:** Phase 5c — public page polish (Home, Competitions, Clubs, Associations, Players,
Teams, Admin). This is the per-page pass over spacing, typography and interactive states, now
that colour (5a) and the radius/shadow scale (5b) are uniform across the app. Phases 0–4, 5a and
5b are complete: the build is green, `src/` is restructured, the theme tokens are in place **and
in use**, every radius and shadow now comes from a three-value scale, the header is responsive
with a working Log in / Log out button, and loading and empty states render through shared
components.

> **Baseline finding (2026-10-20):** the frontend does **not** build at HEAD `8876186`.
> `npm run build` (`tsc -b && vite build`) fails with **160 TypeScript errors across 13 files**,
> so `vite build` never runs. `git diff --stat` is empty, so this is entirely pre-existing and
> unrelated to the refactor.
>
> `tsconfig.app.json` sets no `strict` flag, but the project pins `typescript: ~6.0.2`, and
> TypeScript 6 defaults `strict` to on. The dominant errors are strict-family
> (`useState([])` inferring `never[]`, implicit `any`, possibly-undefined, null index) plus a
> handful of `noUnusedLocals` errors from flags that are explicitly set.
> `npm run dev` does not type-check, which is why this went unnoticed.
>
> **Decision: fix all 160 errors as Phase 0** before starting the refactor, so that each later
> phase's build check can actually distinguish new breakage from old.
> **Lint gate: no *new* warnings.** The existing `set-state-in-effect`, `exhaustive-deps` and
> `no-unused-vars` warnings are pre-existing logic issues and are left alone, because fixing them
> would mean changing state and effect behaviour.

## Phase 0 — fix pre-existing type errors (no behaviour change) ✅

Errors by file, fixed smallest-first, building after each:

- [x] `main.tsx` (1) — `getElementById` returns `HTMLElement | null`
- [x] `AssociationsPage.tsx` (1) — unused `Link` import
- [x] `manage-associations/EditAssociation.tsx` (1) — implicit `any` props
- [x] `manage-competitions/ManageCompetitionsPage.tsx` (2) — unused `ApiError`, `patchApi`
- [x] `AssociationsList.tsx` (3) — `useState([])` → `never[]`
- [x] `manage-clubs/ManageClubsPage.tsx` (4) — `useState([])` → `never[]`
- [x] `manage-associations/ManageAssociationsPage.tsx` (5) — `useState()` → `undefined`
- [x] `register-team/SelectCompetition.tsx` (9)
- [x] `manage-clubs/EditClubPage.tsx` (14) — `useState({})` → `{}`, `Promise<any>`
- [x] `register-team/RequestDetails.tsx` (19)
- [x] `AssociationProfile.tsx` (24) — unused imports, possibly-undefined, `never[]`
- [x] `register-team/ReviewRequests.tsx` (25)
- [x] `register-team/Registration.tsx` (52)
- [x] Confirm `npm run build` succeeds and lint has no new warnings
- [x] Commit

**Result:** 160 → 0 type errors. `npm run build` succeeds. Lint: **37 → 29 warnings, 0 errors**
(baseline measured by stashing `src/` and re-linting HEAD) — so no new warnings, and 8 pre-existing
ones disappeared as a side effect of typing.

### How the errors were fixed

Almost all were strict-mode type errors with no runtime effect: `useState([])` inferring `never[]`,
implicit `any` parameters, and possibly-undefined reads. Fixes were type annotations, `import type`,
local `const` captures to preserve narrowing, and removing genuinely unused imports/locals.

New file `src/register-team/types.ts` holds the API response shapes for the registration flow
(`NamedRef`, `Season`, `Section`, `Format`, `Player`, `TeamRequest`). Types only.

### Bugs preserved, not fixed (per the "cast around them" decision)

Each of these is a real logic bug, cast around with a comment at the site rather than repaired,
so that the refactor stays behaviour-neutral. **All three need fixing separately:**

1. `manage-clubs/EditClubPage.tsx:47` — `postApi("/clubs", …)` is never awaited, so `clubId` is
   always `undefined` and the follow-up PATCH hits `/clubs/undefined`.
2. `register-team/SelectCompetition.tsx:68` — the `<select>` is seeded with an association
   *object* but `onChange` writes a plain *string* id.
3. `register-team/Registration.tsx:55` — the player search reads `playerText[updatedPlayer]`
   before `setUpdatedPlayer(i)` lands, so it searches with the previous player's text.

### Two type-driven changes worth flagging

- `api.ts`: `patchApi`'s `data` parameter is now optional. `JSON.stringify(undefined)` returns
  `undefined`, so requests that pass no body still send no body — no wire change.
- `manage-associations/ManageAssociationsPage.tsx`: `<EditAssociation>` is now rendered only when
  a selection exists. The early return above it already guaranteed that, so the render tree is
  unchanged in practice.

---

## Approved decisions

| Decision | Choice |
|---|---|
| Log in button | Show **Log in** when signed out, **Log out** when signed in. Adds a small amount of new behaviour (see Open questions). |
| Structure | **Full reorganisation** into `pages/`, `components/{layout,ui}/`, `lib/`. |
| Unused Vite assets | **Leave in place** (`hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`). |
| `index.html` title | Change `frontend` → **`Waverley Tennis`**. ✅ Done in Phase 2. |

## Theme / palette (Phase 2)

Tailwind v4 `@theme` tokens in `index.css`. Components use token names, never raw hex.

- **Primary** `primary-600 #2563eb` (actions/links), `primary-700 #1d4ed8` (hover), plus 50–900.
  Replaces `sky-600 #0284c7`, which is **4.10:1 on white and fails WCAG AA** for normal text.
  `#2563eb` is 5.17:1.
- **Neutrals** `canvas #f9fafb` (page bg), `surface #ffffff`, `border #e5e7eb`,
  `border-strong #d1d5db`; text `ink #111827` (17.7:1), `ink-muted #4b5563` (7.6:1),
  `ink-subtle #6b7280` (4.8:1). Any `text-gray-400` (2.5:1) used for real text moves up.
- **Semantic** `success #15803d` (5.0:1), `warning #b45309` (5.0:1), `danger #b91c1c` (6.5:1),
  each with a matching `-bg` / `-border` tint.
- **Type** drop Kanit; **Inter** throughout. Base 16px (was 18px). Scale: h1 `text-2xl→3xl`,
  h2 `text-lg→xl`, body `text-sm/base`, meta `text-xs/sm`.
- **Shape** `rounded-md` inputs/buttons, `rounded-lg` cards, `shadow-sm` only, `duration-150`.

## Structure (actual, after Phase 1)

```
src/
  App.tsx  main.tsx  index.css          # index.css = Tailwind + @theme + base only (Phase 2)
                                        # App.css (Phase 2) and Ribbon.css (Phase 3) are gone
  pages/
    HomePage  LoginPage  AdminPage
    associations/  AssociationsPage  AssociationProfilePage  AssociationsList
    clubs/         ClubsPage  ClubProfilePage
    competitions/  CompetitionsPage  CompetitionProfilePage  SectionPage
    players/       PlayersPage  PlayerProfilePage  PlayerStats
    teams/         TeamProfilePage  TeamRecordCard
    matches/       MatchResultsPage  EnterResultPage  MatchDetail  UpcomingMatches
                   FixtureCard  FixtureList  LadderTable  RoundSelector
                   ExportFixturesControl  ResultStatusPanel  RubberRow  ScoresheetForm
                   types
    manage/        associations/  clubs/  competitions/  players/
    register-team/ RegisterTeamPage  SelectCompetitionPage  ReviewRequestsPage
                   Registration  RequestDetails  types
  components/
    layout/        Header
    ui/            LoadingState  EmptyState  (Phase 4)
  lib/             api  auth  exportLinks  playerRecord  teamRecord  formatName  scoresheet
  assets/          WaverleyLogo.png  hero.png  react.svg  vite.svg
  mock-data/       MockAssociations  MockCompetitions
```

Naming rule: route-level components get a `Page` suffix; non-route sub-components keep
their descriptive name. Files are **moved**, and renamed only where the rule above requires it.

## CSS migration

| File | Action | Status |
|---|---|---|
| `src/index.css` | Kept as the only stylesheet: Tailwind import + `@theme` + short `@layer base`. Removed the `#root` fixed width / centering rule and the 18px root font-size — the fixed width was why the layout couldn't breathe. | ✅ Phase 2 |
| `src/App.css` | **Deleted.** Imported by nothing; every class was an unused Vite-template leftover (`.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`). | ✅ Phase 2 |
| `src/Ribbon.css` | **Deleted.** Became Tailwind utilities on `components/layout/Header.tsx`; the bare global `nav {}` selector and the 2rem link font went with it. | ✅ Phase 3 |

---

## Checklist

### Phase 1 — Restructure (no visual change) ✅
- [x] Create `pages/`, `components/layout/`, `lib/`
- [x] `git mv` all files to the target tree per the naming rule
- [x] Rewrite every relative import to its new location
- [x] `npm run build` + `npm run lint`
- [x] Commit

**Result:** 60 files moved, 101 import specifiers rewritten across 44 files.
`npx tsc -b` reports 0 errors, `npm run build` succeeds, lint is unchanged at 29 warnings / 0 errors.
The six old feature folders are gone and nothing outside `src/` referenced them.

Renamed by the `Page` suffix rule: `Home`→`HomePage`, `Login`→`LoginPage`,
`AssociationProfile`→`AssociationProfilePage`, `ClubProfile`→`ClubProfilePage`,
`CompetitionProfile`→`CompetitionProfilePage`, `PlayerProfile`→`PlayerProfilePage`,
`TeamProfile`→`TeamProfilePage`, `SelectCompetition`→`SelectCompetitionPage`,
`ReviewRequests`→`ReviewRequestsPage`. Default-exported component *names* are unchanged —
only the filenames moved — so this phase stays behaviour-neutral.

Two deliberate deviations from the tree below:

- The two `types.ts` files stay with their features (`pages/matches/types.ts`,
  `pages/register-team/types.ts`). Merging them into one `lib/types.ts` would have collided.
- `Ribbon.tsx` moved to `components/layout/` but keeps its name; the rename to `Header.tsx`
  happens in Phase 3 together with its rewrite, so Phase 1 stays purely mechanical.

The move + import-rewrite was driven by a throwaway script (mapping table old→new path, then
each relative specifier re-resolved against the file's *old* directory and re-emitted relative
to its *new* one, preserving each specifier's original extension spelling so `./api.js` stayed
`.js`). The script is not committed — this is the resulting tree, not the scaffolding.

### Phase 2 — Theme and global CSS ✅
- [x] Add `@theme` tokens (palette, fonts, radii) to `index.css`
- [x] Add `@layer base`: page background, font stack, `:focus-visible` ring, `body { margin: 0 }`
- [x] Remove `#root` width/border/centering and the 18px root font-size
- [x] Delete `App.css`
- [ ] Delete `Ribbon.css` — **deferred to Phase 3**, see below
- [x] Change `index.html` title to `Waverley Tennis` and move the font load out of CSS
- [x] Build + lint + commit

**Result:** `index.css` is now Tailwind + `@theme` + a short `@layer base` and nothing else.
`npm run build` succeeds, lint is unchanged at 29 warnings / 0 errors, and the
`@import rules must precede all rules` warning is gone.

#### What changed

- **Tokens** for the primary blue ramp, neutrals (`canvas`, `surface`, `border`,
  `border-strong`, `ink`, `ink-muted`, `ink-subtle`), and success/warning/danger each with a
  `-bg`/`-border` tint, plus `--font-sans`/`--font-mono`. Kanit is dropped; Inter carries
  headings as well as body.
- **Removed from `index.css`:** the `#root { width: 1126px; border-inline; text-align: center;
  … }` rule, the 18px root font-size, `letter-spacing: 0.18px`, and the global `h1`/`h2`
  font-size/margin rules. Also the dead `code`/`.counter` rules.
- **Font loading moved to `index.html`** as `<link rel="preconnect">` + a stylesheet link,
  rather than an `@import` in CSS. The Tailwind plugin inlines `@import "tailwindcss"` in
  place, which left the font `@import` sitting after other rules — that was the source of the
  build warning. Loading it in the document head also starts the request earlier.

#### Notes and flagged items

- **Radii were not overridden.** Tailwind's defaults (`rounded-md` 6px, `rounded-lg` 8px)
  already match the "small radius" spec, and overriding them would have changed every
  `rounded-*` in the app at once. Phase 5 shrinks the oversized `rounded-2xl`/`rounded-xl`
  per component instead.
- **`text-align: center` was inherited by every element** from the old `#root` rule and is now
  gone. Every `h1`/`h2` in the app already sets its own size and colour classes, and pages that
  want centring ask for `text-center` explicitly, so this should only left-align text that was
  centred by accident. **Needs a visual pass in Phase 5/6** — it is the one change in this phase
  that could visibly shift more than one page.
- **Unused theme variables are pruned from the output.** Tailwind v4 only emits a `@theme`
  variable once a utility actually uses it — verified against its own defaults, which behave
  the same way. So `--color-ink-muted` and friends are absent from `dist` today and will appear
  as soon as Phase 5 references them. Not a problem, but it means "token missing from the built
  CSS" is not a useful signal.

### Phase 3 — Header, mobile nav, Log in button ✅
- [x] `Ribbon.tsx` → `components/layout/Header.tsx`, all styling as Tailwind
- [x] Desktop nav bar; below `md`, collapse into a hamburger + panel
- [x] 44px minimum touch targets; visible focus states
- [x] Add Log in (signed out) / Log out (signed in) button — right side on desktop,
      inside the mobile menu on small screens; primary button styling
- [x] Build + lint + commit

**Result:** `Ribbon.tsx` and `Ribbon.css` are deleted; `Header.tsx` is the only file that
changed besides `App.tsx`'s two references to it. `npm run build` succeeds (0 type errors),
lint is unchanged at **29 warnings / 0 errors**, and none of them are in `Header.tsx`.

#### What changed

- **The bar is light, not navy.** It is now `bg-surface` with a `border-b border-border`, ink
  text and `primary-600` for the active/hover state. The old bar was `--navy #3a4f85`, which is
  outside the light-theme palette the brief asks for, and the link font drops from `2rem` to
  `text-sm`. Worth noting: those `--navy` / `--navy-dark` variables lived in the old `:root`
  block that Phase 2 deleted, so between Phase 2 and this phase the header was rendering with a
  **transparent background** — this phase is what puts a background back.
- **Nav items are built once** by a `navItems()` helper and rendered twice — desktop bar and
  mobile panel — so the two lists cannot drift. The role gating (`Players` for admin/club admin,
  `Admin` for admin) is unchanged, and so is every label and route.
- **Semantics:** the wrapping `<nav>` became `<header>` + an inner `<nav aria-label="Main">`.
  `NavLink` already sets `aria-current="page"`, so the active item is announced.
- **Mobile:** the hamburger is a 44×44px button with `aria-expanded` / `aria-controls`, and the
  panel closes when a link is followed or when Log out is used. `lucide-react`'s `Menu`/`X` are
  used for the icon, per the existing icon set.
- **Touch targets:** every nav link, button and the logo link carries `min-h-11` (44px).
  Focus states come from the global `:focus-visible` ring added in Phase 2.
- **Log out** clears `access_token`, `personId` and `roles` — exactly the three keys
  `LoginPage` writes — and then navigates to `/login`. This is the one behavioural addition in
  the refactor (see Open questions).

#### Decisions taken in this phase

- **Log out is styled secondary** (bordered, neutral), not primary. The brief asked for the
  *Log in* button to be the primary style; a blue Log out in the header would read as the
  page's main action. Easy to flip if you would rather they match.
- **The header is not sticky.** The old bar scrolled away with the page, and making it stick
  would change how every page behaves. Worth revisiting separately if you want it.
- **No `max-w-*` container yet.** The old `#root` rule capped the app at 1126px and Phase 2
  removed it, so pages are currently full-bleed. The header follows the same
  `px-4 sm:px-6 lg:px-8` padding as the pages rather than introducing a container of its own,
  which would have left the header and the content misaligned. **Phase 4 should add one shared
  container to both**, so they line up on wide screens.

### Phase 4 — Shared UI primitives and responsive layout fixes

Split into two commits. 4a is mechanical and touches 19 files; 4b needs each file read
individually, so doing them together would have made one unreviewable diff.

#### 4a — Loading/empty primitives ✅
- [x] Add `components/ui/LoadingState.tsx` and `components/ui/EmptyState.tsx`
- [x] Replace the 19 hand-written page-level loading states with `<LoadingState />`
- [x] Build + lint + commit

**Result:** 19 files, one site each, 2 insertions / 1 deletion per file. `npm run build`
succeeds, lint unchanged at **29 warnings / 0 errors**, nothing new in the two primitives.

The inventory was worse than the plan assumed: **five** different spellings of the same
three words — `<p>Loading...</p>` (7 files), `max-w-7xl mx-auto px-4 py-12 text-gray-500`
(2), `max-w-3xl mx-auto px-4 py-12 text-gray-500` (3), `text-center py-12` (6), and
`px-4 py-8 text-gray-500` (1). A page's loading state looked different depending on which
page it was. All 19 now render through one component.

Done with a throwaway script (not committed), same shape as the Phase 1 reorg: match the
exact JSX strings, swap them for `<LoadingState />`, then insert the import after the last
single-line import. The relative path is computed from each file's depth, which matters
because `pages/manage/*/` is three levels deep where `pages/*/` is two. The script reported
one site per file and no problems, and two files were spot-checked before building.

**Left as-is deliberately:** three *inline* loading messages that are not page-level states
and whose text is contextual — `UpcomingMatches.tsx:85` ("Loading..." inside a card),
`RequestDetails.tsx:78` ("Loading details...") and `ReviewRequestsPage.tsx` ("Loading
registration requests..."). Swapping them would either change their text (not allowed) or
impose page-level padding inside a card. `UpcomingMatches`' `text-gray-400` is 2.5:1 on
white and fails AA — that is a Phase 5 colour fix, noted there.

#### 4b — Responsive grids, tables and empty states ✅
- [x] Fix the fixed-column grids that cannot fit at 320px
- [x] Tables: check they scroll rather than squish
- [x] Convert the per-page empty states to `<EmptyState />`
- [x] Build + lint + commit

**Result:** build succeeds with 0 type errors; lint unchanged at **29 warnings / 0 errors**.

Corrected inventory (the plan's list was written from a heuristic and was partly wrong —
these are the real numbers, evaluated at a 320px viewport):

| Site | Columns | Fits at 320px? | Action |
|---|---|---|---|
| `TeamRecordCard:34` | `grid-cols-4` | No — ~56px tiles, "RUBBERS" label overflows | `grid-cols-2 sm:grid-cols-4` |
| `EditClubPage:113,128` | `grid-cols-4` | No — 56px label column, "Address" wraps | stack below `sm` |
| `RubberRow:88` | `grid-cols-2` | Cramped — ~130px selects | stack below `sm` |
| `FormatForm:322,366` | `grid-cols-2` | Cramped — ~130px inputs | stack below `sm` |
| `AssociationProfilePage:107` | `min-w-[280px]` | **No — forces page-level horizontal scroll** | `min-w-0 md:min-w-[280px]` |
| `PlayerStats:96` | `grid-cols-3` | Yes — ~80px tiles | leave |
| `MatchResultsPage:104` | `grid-cols-3` | Yes — names wrap, no overflow | leave |
| `MatchDetail:29` | `grid-cols-[1fr_auto_1fr]` | Yes — inherent 3-col score row | leave |

Tables are better than the plan assumed: there are only **two** `<table>`s in the app
(`PlayerStats`, `LadderTable`) and both already sit in `overflow-x-auto` wrappers. A `w-full`
table inside one of those does not overflow — it squishes, wrapping the header text instead.
`LadderTable` has 11 columns, so its table now carries `min-w-[40rem]`: below that it scrolls
inside its own container rather than crushing 11 columns into 320px. `PlayerStats` has 5
columns of short values and fits, so it is left alone — its `overflow-x-auto` already covers
narrower cases.

#### What changed in 4b

| File | Change |
|---|---|
| `teams/TeamRecordCard.tsx` | `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` |
| `manage/clubs/EditClubPage.tsx` (×2) | label/input rows stack below `sm`; label left-aligns on mobile, stays right-aligned from `sm` |
| `matches/RubberRow.tsx` | home/away player columns stack below `sm` |
| `manage/competitions/FormatForm.tsx` (×2) | Teams and Scoring field pairs stack below `sm` |
| `associations/AssociationProfilePage.tsx` | `min-w-[280px]` → `min-w-0 md:min-w-[280px]` |
| `matches/LadderTable.tsx` | table gains `min-w-[40rem]` so it scrolls instead of squishing |
| 6 files | full-width "no results" panels → `<EmptyState />` |

The `AssociationProfilePage` one was a real bug rather than a tight fit: the contact card
carried `min-w-[280px]` inside a card that is only ~240px wide at a 320px viewport, so it
overflowed its parent and gave the whole page a horizontal scrollbar. `min-w-0` fixes it and
`md:min-w-[280px]` leaves the desktop layout identical.

#### Empty states: what was converted, and what was not

Six full-width panels now render through `<EmptyState />` — `CompetitionsPage`, `ClubsPage`,
`PlayersPage`, `ManagePlayersPage`, `ManageCompetitionsPage` (five of them the identical
`text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg` box) and
`ManageClubsPage` (`py-10`, `rounded-xl` and a `shadow-sm`). `ManageCompetitionsPage` was
missed by the first inventory pass and only turned up in a follow-up grep for the old class
string, which is why the grep is worth running rather than trusting the list.

**Left as plain text**, because a bordered panel nested inside an already-bordered card reads
as a double border:

- `CompetitionProfilePage.tsx:175,180` — "No seasons recorded…", "No sections found…"
- `PlayerStats.tsx:78` — "No results for this filter."
- `ManageCompetitionPage.tsx:159` — "This competition doesn't have any seasons yet…", which
  carries its own "Create new season" button
- `TeamRecordCard.tsx:16` — "No completed matches yet this season."

**Left for Phase 5**, because they are a different family of state:

- The error and not-found returns: 5 × `if (loadError) return <div className="text-center
  py-12 text-red-600">Error: …` and 3 × `if (!x) return <div className="text-center
  py-12">… not found.</div>`. They sit *adjacent to each other* in the same guard blocks, so
  converting the not-found ones without an `ErrorState` primitive would create a fresh
  inconsistency three lines above each conversion. The pair belongs together, in Phase 5,
  where `ErrorState` can be introduced against real call sites and `text-red-600` migrates
  to `text-danger`.
- `register-team/RequestDetails.tsx:77` and `ReviewRequestsPage.tsx:97,101` — these use
  `slate-*`, `rounded-xl` and `animate-pulse`, all of which Phase 5c is removing anyway.

#### A note on this phase's verification

The tool-safety classifier went down partway through 4b and refused every `Bash` call for a
stretch, so the build and lint could not be run until it came back. While it was down the edits
were checked read-only instead: a grep confirmed all six `EmptyState` conversions have both an
import and a usage, another confirmed no old grid or empty-panel class strings remain, and each
conversion's surrounding markup was re-read to confirm it is a page-level alternative to a grid
rather than something nested inside another card. The build and lint were then run normally and
both pass, so nothing rests on the read-only pass.

### Phase 5 — Page polish

#### 5a — Colour tokens, applied globally (one commit) ✅

Every raw Tailwind colour class in `src/` rewritten onto the theme tokens declared in
`index.css`: **1001 occurrences across 51 files**, 0 remaining (verified by an independent
grep for any `<prop>-<palette>-<shade>` pattern). This is what makes the theme variables appear
in the built CSS — until now Tailwind v4 pruned them all as unused, because nothing referenced
them.

The app was carrying **four different blues** (`sky-*` 182 occurrences, `blue-*` 50, plus
slate-blue) and **two neutral families** (`gray-*`, `slate-*` ~130) with six grey text levels.
All of that now resolves to one blue ramp and three text weights.

| From | To | Occurrences |
| --- | --- | --- |
| `sky-NNN`, `blue-NNN` | `primary-NNN` | ~232 |
| `text-gray-900/800`, `text-slate-900/800` | `text-ink` | 145 |
| `text-gray-700/600`, `text-slate-700/600` | `text-ink-muted` | 119 |
| `text-gray-500/400/300`, `text-slate-500/400` | `text-ink-subtle` | 106 |
| `bg-white` | `bg-surface` | 102 |
| `bg-gray-50`, `bg-slate-50` | `bg-canvas` | 42 |
| `bg-gray-100`, `bg-slate-100` | `bg-muted` (new token) | 22 |
| `bg-gray-200`, `bg-slate-200` | `bg-border` | 11 |
| `border-gray-200/100/50`, `border-slate-200/100` | `border-border` | 76 |
| `border-gray-300`, `border-slate-300` | `border-border-strong` | 77 |
| `ring-sky-500`, `ring-blue-500` | `ring-primary-500` | 39 |
| `text-red-*`, `text-rose-*` | `text-danger` | 29 |
| `bg-red-50`, `border-red-200` | `bg-danger-bg`, `border-danger-border` | 8 |
| `bg-amber-*`, `text-amber-*`, `border-amber-*` | warning tokens | 12 |
| `bg-emerald-*`, `bg-green-*`, `text-emerald-*` | success tokens | 6 |
| `accent-blue-600` | `accent-primary-600` | 1 |
| `bg-black/40` (modal scrim) | `bg-ink/40` | 2 |

Two deliberate exceptions:

- **`text-white` (35 occurrences) is kept.** It is Tailwind's own `--color-white` token, not a
  hard-coded hex, and it is the correct foreground for primary and danger fills. Naming it
  `on-primary` would be wrong wherever it sits on a red or green button.
- **Opacity modifiers are preserved** (`bg-gray-50/70` → `bg-canvas/70`, `border-gray-200/60` →
  `border-border/60`) rather than dropped, so the migration does not quietly change how
  translucent any surface is.

Three contrast fixes fall out of this for free: `text-gray-400` (2.5:1 on white, fails AA) and
`text-sky-600` (4.10:1, fails AA) are both gone, and the amber/red/emerald text all move to
tokens that were picked to clear 4.5:1.

#### `AdminPage` page container (user request) ✅

`AdminPage` was the only page shell in the app with no container at all: a bare `<div>`, so
its six cards ran right up to the screen edge while the header above them was inset by `px-4`,
which is what made it look wrong. It now uses `max-w-4xl mx-auto px-4 py-8` — the same
container every sibling page uses — so it is inset on both sides at every width and no longer
stretches across a 1440px screen. One-line diff, no other change to the page.

#### 5b — Radius and shadow scale, applied globally (one commit) ✅

Same shape of problem as 5a, so the same treatment: the app carried **six radius values and
seven shadow values**, and the brief asks for "small radius, restrained shadows". 93 utilities
across 26 files collapsed onto three of each.

| From | To | Occurrences |
| --- | --- | --- |
| `rounded-2xl`, `rounded-xl` | `rounded-lg` | 33 |
| `rounded` (bare) | `rounded-md` | 49 |
| `shadow-xs`, `shadow` (bare) | `shadow-sm` | 6 |
| `shadow-lg`, `shadow-xl` | `shadow-md` | 5 |

Leaving a deliberate three-value scale each:

- **Radius** — `rounded-md` (6px) for controls (inputs, buttons, chips), `rounded-lg` (8px) for
  surfaces (cards, panels, modals), `rounded-full` for pills and avatars only. The old
  `rounded-2xl` (16px) on cards was the main offender against "modest radius".
- **Shadow** — `shadow-sm` resting, `shadow-md` for hover and overlays, `shadow-none` where a
  border already does the work. Nothing heavier than `shadow-md` exists in the app now.

`transition-shadow` (10 occurrences) is a transition utility rather than a shadow value and is
left alone. Noting this for accuracy: the first inventory counted "13 bare `shadow`", but 10 of
those were the `shadow` inside `transition-shadow` — only 3 were genuinely bare, on the three
page-level centred cards in `App.tsx`, `LoginPage.tsx` and `EnterResultPage.tsx`.

#### 5c–5f — per-area detail polish (batched, one commit each)

- [ ] 5c Public pages: Home, Competitions(+Profile, Section), Clubs(+Profile),
      Associations(+Profile, List), Players(+Profile, Stats), Teams, Admin
- [ ] 5d Manage pages: associations, clubs, competitions, players
- [ ] 5e `register-team/` — swap the `←` `→` text glyphs for lucide icons
- [ ] 5f `match-results/` — scoresheet, rubber rows, status panel

### Phase 6 — Responsive and accessibility sweep
- [ ] Check 320 / 375 / 768 / 1024 / 1440px, no horizontal page scroll at any width
- [ ] Check usable at 200% browser zoom
- [ ] Inputs ≥16px on mobile; touch targets ≥44px; labels on all fields; semantic HTML
- [ ] Build + lint + commit

### Phase 7 — Summary
- [ ] Summarise changes, list any CSS that could not be removed and why, flag uncertainties
- [ ] Update this file

---

## Open questions / flagged items

- **Dead links (not touched):** `Login.tsx` links to `/forgot-password` and `/register`;
  `App.tsx` defines neither route. Pre-existing, left as-is.
- **Log out is new behaviour.** The plan was "visual only", but there is no logout anywhere
  in the app today (`auth.ts` has no logout function), so a Log out button has to clear the
  three `localStorage` keys and navigate to `/login`. Flagged as the one behavioural addition.
- **Auth state is not reactive, but the header keeps up on navigation.** `auth.ts` reads
  `localStorage` at call time and nothing subscribes to changes, so the header only re-reads it
  when it re-renders. Both flows happen to navigate — login goes to `/`, Log out goes to
  `/login` — and `Header` sits outside `<Routes>`, so a route change re-renders it and the
  button flips without a reload. A `localStorage` change that does *not* navigate (another tab
  signing out) still will not update it. Fixing that properly means new state management — out
  of scope unless asked.
- **Google Fonts** stays as a remote `@import`; Kanit is dropped, Inter is kept.
- **No frontend tests exist.** Verification is build + lint. The backend e2e suite is
  destructive and unrelated, so it is not run.
- **CSS `@import` ordering warning at build.** Vite reports `@import rules must precede all
  rules aside from @charset and @layer statements` — the Google Fonts `@import` sits below
  `:root` in the stylesheet. Harmless today, and resolved in Phase 2 when the global CSS is
  rewritten.

## Decisions log

- Phase 1 keeps filenames unless the `Page` suffix rule requires a rename, to keep the diff
  reviewable and the "no visual change" claim verifiable.
- Relative imports are used (no `@/` path alias) to avoid touching `tsconfig`/`vite.config`.
- Phase 0 fixed the type errors rather than loosening `tsconfig`, so the strictness stays on
  for the rest of the refactor. `strict` is *not* written into `tsconfig.app.json` — it is
  TypeScript 6's default, and adding it would only restate what is already true.
- The original plan deleted `App.css` *and* `Ribbon.css` in Phase 2, but `Ribbon.tsx` still
  imports `Ribbon.css`, so deleting it there would have broken the build for one phase. Its
  deletion moved to Phase 3, where the file is rewritten as Tailwind anyway.
- Phase 3 styles Log out as a secondary button and leaves primary blue to Log in, and leaves the
  header non-sticky and without a `max-w-*` container (see the phase notes for the reasoning on
  each). All three are one-line changes if you would rather they went the other way.
- The `Ribbon.tsx` → Tailwind rewrite used `NavLink`'s function `className`, typed with
  `NavLinkRenderProps` from `react-router-dom`. The prop is
  `string | ((props: NavLinkRenderProps) => string | undefined)`, so a hand-written
  `{ isActive: boolean }` parameter would have failed `strictFunctionTypes` — the parameter has
  to accept the whole render-props object.
- **Phase 4 adds only the two primitives it can use immediately** (`LoadingState`,
  `EmptyState`) rather than the full `Button`/`Card`/`Field` set the plan mentioned. Creating
  components that nothing renders yet is dead code, and Phase 5 rewrites each page anyway —
  so `Button`, `Card` and `Field` will be introduced there, against real call sites, if they
  still look worth it once the pages have been through the polish pass. The plan's premise was
  that Phase 4 would create them and Phase 5 would adopt them; inverting that keeps the
  codebase free of unused abstractions at every commit.
- **Phase 4 was split into 4a and 4b** (one commit each) so the 19-file mechanical swap is
  reviewable on its own rather than mixed in with the per-file layout decisions.
- Phase 4b converted only the full-width "no results" panels to `EmptyState`, not the empty
  messages rendered inside cards, and deliberately left the error/not-found returns for
  Phase 5 so the pair can be converted together with a new `ErrorState`. The reasoning for
  both is in the Phase 4 section.
- **Phase 5a was re-sequenced: the colour-token migration runs globally in one commit, rather
  than as the first slice of each per-area batch as the approved plan had it.** Two reasons.
  First, pages are composed of files from several folders — `competitions/SectionPage.tsx`
  renders `matches/FixtureList.tsx` and `matches/LadderTable.tsx` — so an area-by-area split
  would leave every page half-tokenised at each commit boundary, which is exactly the
  inconsistency the pass exists to remove. Second, the transform is mechanical and uniform, so
  a 51-file diff of nothing but colour-class renames is easier to review than five smaller
  diffs that each mix renames with judgement calls. The per-area work (radii, shadows, spacing,
  icon glyphs) still runs as batches 5b–5e, one commit each, as approved.
- **`--color-muted` (#f3f4f6) was added to the palette in 5a.** The neutrals had `canvas`
  (#f9fafb) and `border` (#e5e7eb) but nothing in between, and 22 chips, badges and inset panels
  were reaching for `bg-gray-100`/`bg-slate-100` to fill that gap. Adding the token was the
  alternative to mapping them all onto `canvas` and losing the contrast that makes a badge read
  as a badge.
- **`text-white` is the one raw colour class left in `src/`, deliberately.** See the 5a notes —
  it is Tailwind's default `--color-white` token rather than a hex, and it is the correct
  foreground on both primary and danger fills, so a semantic alias would be wrong half the time.
- **Phase 5b continues the 5a re-sequencing: the radius and shadow scale was normalised
  globally in one commit, ahead of the per-area polish batches.** The reasoning is the same one
  that moved the colour pass global — radii and shadows are set by shared sub-components
  (`RubberRow`, `FixtureCard`, `ResultStatusPanel`) that public and manage pages both render, so
  an area-by-area pass cannot reach a consistent scale at any single commit. The per-area work
  that genuinely needs per-page judgement (spacing, typography, hover and focus states) stays
  batched as 5c–5f, one commit each. The approved plan's 5b–5e are now 5c–5f; no work was
  dropped, only reordered.
- **Radius and shadow are deliberately not theme tokens.** Colour lives in `@theme` because the
  brief says colours live only there, and because a palette needs names (`danger`, `ink-muted`)
  that say what they mean. Radius and shadow are already a closed numeric scale in Tailwind, and
  the fix was to use *fewer* of its steps rather than to invent names for them — adding
  `--radius-card` would have restated `rounded-lg` and given reviewers a second vocabulary to
  learn. If the scale ever needs to change app-wide, Tailwind v4 lets `--radius-*` and
  `--shadow-*` be overridden in the same `@theme` block.
