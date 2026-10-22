# Frontend Refactor — Progress

Branch: `feature/frontend/refactor`
Scope: visual + structural refactor of `frontend/` only. No functional, route, API, state or
copy changes. Verification per phase: `npm run build` and `npm run lint` in `frontend/`.

**Next step:** the per-area batches are finished. What remains is Phase 6 (the responsive and
accessibility sweep), then Phase 7 (the summary). One question is open before Phase 6 starts — see
the `rounded-md` bullet in Open questions: four controls outside the finished areas are still on
`rounded-md`, and 5b's radius rule says they should be, while the manage and register-team passes
settled the opposite way.
Phases 0–4, 5a–5d and the public-pages, manage-pages, register-team and matches passes are
complete: the build is green, `src/` is restructured, the theme tokens are in place **and in use**,
every radius and shadow comes from a three-value scale, every page shell shares one container that
lines up with the header, loading/empty/error states render through shared components, the header is
responsive with a working Log in / Log out button, the public pages share one title scale, one
heading scale and one card hover, the manage pages run on one input, one primary button and one
secondary button, and `register-team/` and the matches pages are on the same vocabulary with no
opacity modifiers and no sub-16px form controls left in `src/`.

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

#### 5c — One page container, applied globally (one commit) ✅

The Phase 3 notes flagged that the header used `px-4 sm:px-6 lg:px-8` while pages used a flat
`px-4`, so from 640px up the header content sat 8–16px further in than the page content below
it. The same survey turned up five different page-shell padding combinations — including
`SectionPage`, whose shell was `max-w-5xl mx-auto` with no padding at all, so its content ran to
the screen edge.

38 page shells across 28 files now share one container: `max-w-* mx-auto px-4 py-8 sm:px-6
lg:px-8`. Only the max-width stays per-page (narrow forms vs wide grids); the padding is
uniform, and it matches the header exactly, so page content and the logo share a left edge at
every breakpoint.

| Shell was | Now |
| --- | --- |
| `px-4 py-8` (20 pages) | `px-4 py-8 sm:px-6 lg:px-8` |
| `px-4 py-12` (HomePage, state shells) | `px-4 py-12 sm:px-6 lg:px-8` |
| `mt-10 px-4` (ManageClubsPage, EditClubPage) | `px-4 py-8 sm:px-6 lg:px-8` |
| `p-4 space-y-6` / `p-6 space-y-6` | `px-4 py-8 sm:px-6 lg:px-8 space-y-6` |
| *(none)* — SectionPage | `px-4 py-8 sm:px-6 lg:px-8` |

Two things this pass deliberately did **not** touch, both left for their own batches: the
register-team cards (`my-10 p-8`) and the in-page modal panels (`my-8 p-6`), which are not page
shells. The `my-` guard in the transform is what keeps those out.

**One near-miss worth recording.** The rule that adds padding to a shell with none (`mx-auto"`
at the end of the className) also matched a score-summary grid inside `MatchResultsPage` —
`grid grid-cols-3 gap-y-2 text-center max-w-sm mx-auto`. Padding it would have added `px-4 py-8`
to a small three-column score table. It was caught by reading the transform's own output rather
than trusting the count, and reverted; the verification greps afterwards confirm every changed
line is a `max-w-*` shell.

#### 5d — `ErrorState` and the six page-level error returns ✅

`ErrorState` is the third page-level state primitive and the counterpart to `LoadingState`:
`role="alert"`, centred danger text, and — the actual fix — the container padding these returns
never had. Six pages wrote the identical bare
`<div className="text-center py-12 text-danger">Error: {…}</div>` as an early return, so the
message rendered directly under `<main>` with no side padding and no max-width.

**The inventory was wrong again, in the same direction as 5b.** The Phase 4b note said "5 error
+ 3 not-found" and assumed the not-found returns shared one shape, so the pair could be
converted together. Measuring them found **6** error returns — all byte-identical, so the
conversion is mechanical — and **five** different not-found shapes:

| Not-found shape | Sites |
| --- | --- |
| Container + "Back to…" link (the message `<p>` sits inside it) | `CompetitionProfilePage` |
| Bare `<div className="text-center py-12">`, **no colour class at all** — so full-strength body text | `ManageCompetitionPage`, `ManageSeasonPage`, `ManageSectionPage` |
| `<div className="p-8 text-center text-ink-muted">`, no max-width | `AssociationProfilePage` |
| `<p className="text-ink-muted mb-4">` inside a page shell | `ClubProfilePage`, `PlayerProfilePage`, `TeamProfilePage`, `EditPlayerPage`, `MatchResultsPage` |
| A bare text node in a shell; a string in a ternary | `SectionPage`, `EnterResultPage` |

**So the not-found states are deliberately not converted here.** They are not errors — the record
simply does not exist — and there is no single treatment to apply: three want a container, one
already has a link block, and five sit inside shells where a bordered panel would double-border
the card around them. Each is handled in its own page's pass, with that page's context in view.

Verified: 6 imports, 6 usages, no instance of the old shape left, build green, lint unchanged.

#### Per-area detail polish (one commit each, unnumbered)

The numbering is dropped here deliberately. This work is genuinely per-area — spacing,
typography and interactive states inside each page — and it kept needing to be renumbered as
cross-cutting passes (5a–5c) were found ahead of it. The areas:

- [x] Public pages: Home, Competitions(+Profile, Section), Clubs(+Profile),
      Associations(+Profile, List), Players(+Profile, Stats), Teams, Admin
- [x] Manage pages: associations, clubs, competitions, players — four commits, see below
- [x] `register-team/` — the `my-10 p-8` cards, the `←` `→` text glyphs → lucide icons, and the
      opacity modifiers — two commits, see below
- [x] `matches/` — the scoresheet, the rubber rows and the status panel — one commit, see below.
      (Called `match-results/` in the original plan; the folder has always been `pages/matches/`.)

##### Public pages — one commit ✅

Twelve of the fifteen files changed. `HomePage`, `AdminPage`, `TeamRecordCard` and
`PlayerStats` were already consistent and were left alone; the two stats cards in particular
agree with each other down to the `tracking-wider` on their headline labels.

| What | Before | After |
| --- | --- | --- |
| Page title | `text-3xl font-bold` on ten pages, but `text-2xl font-bold tracking-tight` on Associations and `text-2xl sm:text-3xl … tracking-tight` on the association profile | `text-3xl font-bold text-ink` everywhere except the Home hero, which is a landing headline and keeps `text-4xl font-extrabold sm:text-5xl` |
| Section heading | `text-xl font-bold` on five pages, `text-lg font-semibold` on the association profile's two boxes | `text-xl font-bold text-ink` |
| Card hover | grids: `hover:shadow-md transition-shadow`. Both association files: `hover:border-primary-300 hover:shadow-md transition-all duration-200` plus a decorative `group-hover:translate-x-*` on the chevron | top-level cards lift (`hover:shadow-md transition-shadow`); rows **inside** a card change background (`hover:bg-surface transition-colors`) |
| Link colour | `text-primary-600` (75 uses) vs `text-primary-700` (20) | `text-primary-600` for link text. Pills keep `text-primary-700`, where the darker shade is doing contrast work against `bg-primary-50` |
| Card call to action | `View X Profile &rarr;`, the arrow as text | the same words plus a lucide `ArrowRight`, as the register-team batch already planned |
| Token opacity | `border-border/80`, `/60`, `/50`, `bg-canvas/80`, `/70` — every one of them in the two association files | plain `border-border` / `bg-canvas` |
| Odds and ends | `border-2 border-dashed`; `rounded-full` on the count chips; `shadow-sm` on the three search inputs; a stray `text-center` on `ClubsPage`'s card title; a dead `group-hover:text-ink` on text that is already `text-ink` | `border border-dashed`; `rounded-md` to match every other meta chip; no input shadow, matching every form input in the app; removed |

The two association files were the whole outlier set — they are the only place in `src/` using
token opacity modifiers, `transition-all`, `duration-200` or a decorative transform, and the only
pages not on the `text-3xl`/`text-xl` scale. Worth knowing for the remaining batches: that style
came in with `47c4b11`, not with the original pages.

##### Manage pages — four commits ✅

Associations `f0d653b`, clubs `05be79c`, players `6b74bf6`, competitions `5f37872`. Split four ways
rather than kept as one: seventeen files with genuinely per-page judgement is more than one
reviewable diff, and the four areas needed visibly different amounts of work (clubs changed two
files, competitions five).

Unlike the public pages, this area's problem was not two competing styles but **four input
vocabularies and five primary-button sizes**, none of which had been chosen — they were what each
form happened to be written with:

| What | Before | After |
| --- | --- | --- |
| Input | `block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:ring-2 focus:ring-primary-500` (13 uses, every form outside the player pages), a compact `mt-1 w-full rounded-md border border-border-strong px-3 py-1.5` (14 uses, both player forms plus `ClubSearch`), a `text-sm` variant, and a `px-3.5 py-2` variant | the canonical, everywhere |
| Primary button | `bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50` (6 uses) plus `px-5 py-2`, `px-4 py-2` and `px-4 py-2 text-sm` variants | the canonical |
| Secondary button | `border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border` in the section forms, and four other treatments elsewhere (bordered-transparent, `shadow-sm`, `text-ink-muted`) | the `bg-muted` one |
| Page title | `text-3xl font-bold text-ink` (11 uses), `text-2xl` on both player forms | `text-3xl` |
| Text `+` as an icon | `+ New Association`, `+ Add new player`, `+ Create new season` ×2, `+ Create new section`, `+ Create new competition`, `+ Add rubber` | lucide `Plus`, with the spacing on the flex parent's `gap-1.5` |
| Card shadow | `shadow-sm`, except `shadow-md` on the `EditClubPage` form card | `shadow-sm` |
| List rows | `transition-all` plus a `hover:border-primary-300` that only moved the border colour | `hover:shadow-md transition-shadow`, as the public lists do |

Three things were deliberately left. The centred `h1` on `CreateAssociationPage` and
`ManagePlayersPage` — both carry a comment saying the centring is intentional, and the players page
uses a three-column grid so the title is centred on the *page* rather than in the space the button
leaves. And `shadow-md` on the format panel, which is a dialog on a scrim rather than a card.

The three bare not-found returns — `ManageCompetitionPage`, `ManageSeasonPage`,
`ManageSectionPage` — were the worst of the five shapes 5d measured: an uncontained
`<div className="text-center py-12">` with no colour class, so "X not found." rendered in
full-strength body text directly under `<main>`. They now use the same container as their page and
`text-ink-muted`, matching what `SectionPage` got in the public pass. The remaining not-found work
is `MatchResultsPage` and `EnterResultPage`, both in bullets that are still open.

Two flags for Phase 6 from this batch: `ManageAssociationsPage` returns `undefined` while loading,
so the page is blank until the fetch resolves; and `ClubSearch`'s option rows are about 33px tall.

##### `register-team/` — two commits ✅

Hub and review flow `7c4869b`, registration form `fc8d411`. Split in two because the first commit
carries the one stylesheet change in the batch (the button cursor rule), and that line is easier to
review and to revert on its own than buried in a forty-line page diff.

This area is not a route in the usual sense — `/manage-teams`, `/manage-teams/register` and
`/manage-teams/review` are three states of one flow, and the four page files share one shell, one
header and one back chip. It was also the last place in `src/` with `my-10 p-8` cards, text arrows
and opacity modifiers.

| What | Before | After |
| --- | --- | --- |
| Page shell | `max-w-2xl mx-auto my-10 p-8 bg-surface rounded-lg shadow-md border border-border font-sans text-ink` | `mx-4 my-8 max-w-2xl p-8 bg-surface border border-border rounded-lg shadow-sm sm:mx-auto` |
| Page title | `text-2xl font-bold text-ink` on all four | `text-3xl font-bold text-ink` |
| Input | `w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all` | the canonical control class |
| Secondary button | the compact back chip, `px-3 py-1.5 … text-xs`, and a bordered `+ Add Player` | the compact chip, restyled; `+ Add Player` becomes the `+ Add rubber` affordance from the manage pass |
| Text `←` / `→` | `← Back`, `← Change Season`, `→` as a row's affordance | lucide `ArrowLeft` / `ArrowRight` |
| In-card rows | `hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700` plus `shadow-sm` | `bg-canvas hover:bg-surface border border-border transition-colors` |
| Token opacity | `bg-canvas/50` ×3, `border-border/80` ×3, `bg-primary-50/50`, `border-warning-border/60` | plain tokens — the last seven in `src/` |
| Loading state | a hand-rolled `<p>` with `animate-pulse` in both `ReviewRequestsPage` and `RequestDetails` | `LoadingState` — the only two `animate-pulse` in the app, now gone |

**The one stylesheet change: `button:not(:disabled) { cursor: pointer }`.** Tailwind v4's preflight
no longer sets it, so every button in the app was showing an arrow cursor. Twelve `cursor-pointer`
utilities had grown up in this area papering over it one button at a time. One base rule replaces
all twelve, and it is one line to revert if you would rather it did not exist. The two `<label>`s
acting as rows (`RequestDetails`' section radios, `Registration`'s gender radios) keep their own
`cursor-pointer`, because the base rule only reaches `button`.

**The shell keeps its card, and gains phone gutters.** The brief freezes layout, so the page is not
restructured into container + card. `mx-4 … sm:mx-auto` is the one addition: it is what the earlier
AdminPage complaint asked for, and it stops the card touching the screen edge on a phone.

**Three deliberate outliers were left.** The centred title on `RegisterTeamPage`, which is
`relative` with an `absolute right-0` back button so the title stays centred on the page. The
`shadow-md` on the two dropdown panels in `Registration` and on the format panel in
`ManageSectionPage`, which float above the form rather than sitting on the canvas. And the
`cursor-pointer` on the two `<label>` rows, for the reason above.

**The header back chips stay compact on purpose.** They are `absolute right-0` (or `shrink-0` in a
`justify-between` header) beside a centred title, so at 320px a 44px-tall chip would crowd the
heading. The 44px touch target is deferred to Phase 6, which owns that audit and can judge it
against the real layout.

**Two dead hovers were fixed rather than normalised.** `RequestDetails`' approve and deny buttons
carried `hover:bg-success` / `hover:bg-danger` on top of a base `bg-success` / `bg-danger` — a
no-op, since the hover value was the same as the resting one. The background now sits entirely
inside the disabled/enabled ternary and the hover is `hover:opacity-90`, so precedence is
deterministic rather than dependent on stylesheet order. A duplicate `pt-2 pt-4` on the same
element also went.

**Two pre-existing functional bugs are preserved**, both with in-code comments and both out of
scope: `updatePlayerText` searches on `playerText[updatedPlayer!]`, which still holds the previous
index; and `SelectCompetitionPage`'s association select is seeded with an object while reading and
writing a string id.

Flags for Phase 6 from this batch: the sub-44px controls (the four header back chips, both radio
groups, and `ClubSearch`'s option rows); and the two loading states converted here, which were the
last `animate-pulse` in `src/` — the app has none left.

##### `matches/` — one commit ✅

One commit, `c92b429`, seven files. The folder is `pages/matches/`; the plan called it
`match-results/`, which was never a path in the tree.

The smallest batch of the four, because 5a and 5b had already done the cross-cutting work here: no
raw colour classes, no opacity modifiers, no `transition-all`, no `focus:border-transparent`, no
text arrows, and no `text-sm` outside a control. The area's real problem was narrower and more
specific — it had grown its own compact control vocabulary, and never got the focus treatment the
rest of the app uses.

| What | Before | After |
| --- | --- | --- |
| Input / select / textarea | `rounded-md border border-border-strong` with no background and no focus style (`RubberRow`'s `inputClass` and `tiebreakClass`, three textareas) | `rounded-lg border border-border-strong bg-surface … focus:outline-none focus:ring-2 focus:ring-primary-500`, with the compact padding kept |
| `text-sm` / `text-xs` on a control | on every input and select in `RubberRow` — the last sub-16px form controls in the app | removed; the tiebreak boxes stay `w-12`, which still fits a two-digit score at 16px |
| Primary button | `rounded-md bg-primary-600 … text-sm text-white`, with no `font-medium` anywhere in the area | `rounded-lg`, `font-medium`; compact `px-3 py-1.5` for the inline status actions, `px-6 py-3` for the scoresheet's own submit |
| Secondary button | `rounded-md border border-border-strong … text-ink-muted hover:bg-canvas` | `rounded-lg border border-border-strong bg-muted … text-ink hover:bg-border` — the canonical secondary colours |
| Page title | `text-xl font-bold text-ink` on both `MatchResultsPage` and `EnterResultPage` | `text-3xl`, matching the other 26 pages |

Two strays in the same folder went with it: `FixtureCard`'s "Enter result" link, which is the same
compact primary button as the status panel's, and `ExportFixturesControl`'s "Confirm Export" — the
only primary button in the app on `font-semibold` rather than `font-medium` (28 to 1).

**The area's controls were on `rounded-md` and that was the documented rule, which is the
interesting part.** 5b's note says the three-value scale is "`rounded-md` (6px) for controls
(inputs, buttons, chips), `rounded-lg` (8px) for surfaces". But 5b reached that by collapsing bare
`rounded` (4px) *up* to `rounded-md` — it did not set the control radius deliberately. The manage
and register-team passes then standardised inputs on `rounded-lg`, and the app is now 52 to 6 for
inputs and 29 to 8 for buttons. So the batch follows the code, and 5b's note is corrected below.

**Kept deliberately:** `rounded-md` on the four inline warning and danger banners, which is the
app's banner treatment and which this area is the reference for; `text-2xl` on `EnterResultPage`'s
sign-in card heading, which mirrors `LoginPage`'s and `App.tsx`'s identical cards; the
`animate-spin` spinners, which report progress rather than decorate; and `font-semibold` on
headings, which ten other headings use.

**One stale note corrected.** The manage-pages section said "the remaining not-found work is
`MatchResultsPage` and `EnterResultPage`". Both were already in the shape the manage pass settled
on — a contained `max-w-3xl … text-center` wrapper with `text-ink-muted` — so there was nothing to
do but drop a dead `mb-4` from `MatchResultsPage` (nothing followed the `<p>`). The five-shape
not-found survey in 5d counted these two among the fixed, not the outstanding.

Flags for Phase 6 from this batch: the compact buttons in `ResultStatusPanel` are `px-3 py-1.5`,
about 32px tall, and the tiebreak inputs are `w-12` — both worth checking against the 44px target
and the 200% zoom pass.

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

- **Dead links — resolved, and the earlier note here was wrong.** The older claim that `Login.tsx`
  links to `/forgot-password` and `/register` (neither of which `App.tsx` defines) does not apply:
  `LoginPage.tsx` imports only `useNavigate` and has no such links. Checking every static `to=`
  target against the 32 routes in `App.tsx` then flagged `ManageClubsPage`'s `<Link to="new-club">`,
  which this file recorded as opening "the club edit page for a club that does not exist, and there
  is no create-club route". **That was wrong, and is corrected here.** `EditClubPage.tsx:17` reads
  `if (id === "new-club") { creatingNew = true; startedNew = true; }` — the relative link resolves
  to `/manage-clubs/new-club`, matches `/manage-clubs/:id`, and the page switches to create mode.
  The route *is* the create-club flow. No bug, no missing route, and nothing for a reviewer to
  chase.
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
- **`AssociationProfilePage` has no loading state, so it flashes "Association not found."** It
  has no `loading` flag at all — `association` starts `undefined`, so the not-found branch renders
  on the first paint of every visit before the real card replaces it. **Not fixed:** adding the
  flag is a state-logic change, which the brief rules out. The not-found return itself *was*
  fixed — it had no container and no back link, so the message sat flush against the viewport
  edge inside a bare `p-8`; it now matches the other four profile pages.
- **The three grid pages skip a heading level.** `CompetitionsPage`, `ClubsPage` and
  `PlayersPage` go `h1` → `h3` with nothing between, because their card titles are `h3`. Those
  should be `h2`. Left for Phase 6, which owns semantic HTML — it is a tag change with no visual
  effect, so it belongs with the rest of the a11y sweep rather than here.
- **`ClubProfilePage`'s member badge is positioned against its own title.** The badge is
  `absolute top-0 right-0` inside a `text-center` block, and the `h1` carries `pr-28 sm:pr-0` to
  keep clear of it — so on a narrow screen the title is centred inside a box that is not the
  card. Left for Phase 6, where the 320px pass can judge it against the real layout instead of
  guessing.
- **The register-team back chips are under 44px, deliberately for now.** All four are `px-3 py-1.5`
  with `text-xs`, which lands around 30px tall. They sit beside a centred or `justify-between`
  title and would crowd it at 320px if grown to 44px. Phase 6 owns the touch-target audit and can
  settle it against the real layout — the alternatives are a full-size chip, an icon-only button
  with an `aria-label`, or moving the chip below the title on narrow screens. Same batch, same
  question: both radio groups and `ClubSearch`'s option rows.
- **Four controls outside the finished areas are still on `rounded-md`, and this is the one open
  question.** Every area has now been through, and the app's control radius is `rounded-lg` by a
  wide margin — 52 to 6 across inputs, 29 to 8 across buttons. What is left on `rounded-md`:
  `LoginPage`'s two inputs and its submit button, and the identical sign-in button in `App.tsx`'s
  admin gate. (Two others are `rounded-md` for good reason and stay: the header's nav link, which
  is a nav item rather than a control, and `CreatePlayerPage`'s checkbox, which is `h-4 w-4`.)
  **Why this is a question and not a fix:** 5b's note says controls are `rounded-md` and surfaces
  `rounded-lg`, so those four *conform to the documented rule* — they were correct when their
  areas were signed off. The manage and register-team passes then settled inputs on `rounded-lg`,
  which is what the other 52 do. One of the two has to give: either those four move to
  `rounded-lg` (four lines, two files), or 5b's note is right and the 52 are wrong, which would be
  a much larger revert. Left as-is rather than decided unilaterally, because it reopens two areas
  that are already ticked.
- **CSS `@import` ordering warning at build — resolved.** The earlier note here said Vite warned
  that `@import` rules must precede all other rules, because the Google Fonts `@import` sat below
  `:root`. The Phase 2 stylesheet rewrite put it back at the top; the current build prints no
  such warning.

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
- **Phase 5c is the third cross-cutting pass, and the numbering is dropped for what follows.**
  The container is one decision applied to 38 shells, not fourteen per-page decisions, so it went
  global like 5a and 5b. Rather than renumber the per-area batches a third time they are now
  listed unnumbered: the sequence kept churning because each cross-cutting concern (colour,
  radius/shadow, container) only became visible once the previous one was uniform.
- **The page container is not a shared `<Page>` component.** A component is the DRY answer, but
  the brief says page layouts and structure stay as they are, and wrapping 28 page shells in a
  new element would be a structural change to every page — and each page's `max-w-*` differs
  anyway. Repeating the same utility string is the smaller, more reviewable change, and it stays
  a one-line edit per page if the scale ever moves.
- **Phase 5d narrows the Phase 4b plan on purpose.** Phase 4b deferred the error and not-found
  returns together, on the assumption that the not-found states shared one shape and would
  otherwise sit inconsistently a few lines below a converted error. Measuring them showed five
  shapes (see the 5d table), so only the six identical error returns were converted. The
  not-found states are not errors, and choosing one treatment for five shapes is a design
  decision that belongs with each page, not with a mechanical commit.
- **`ErrorState` is the third page-level state primitive, and probably the last.**
  `LoadingState` is plain centred text, `EmptyState` is a bordered neutral panel used inside a
  page shell, and `ErrorState` is centred danger text with `role="alert"`. No not-found
  primitive is created until the per-area passes show whether one is genuinely needed — the
  five shapes above suggest the answer is per-page judgement, not a component.
- **The inline error banners are not `ErrorState`.** Three sites (`LoginPage`,
  `ResultStatusPanel`, `ScoresheetForm`) already agree on
  `rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger` for form-level
  errors, and about a dozen more use a bare `text-danger text-sm`. That is a different
  presentation for a different job — a message beside the field that failed, not a full-page
  state — so it is left for the per-area passes, where the form context is visible and the
  question of whether the bare ones should become banners can be judged per form.
- **The public-pages batch settles scales and states, and changes no layout.** Two title sizes
  were in use for the same job (`text-3xl` and `text-2xl tracking-tight`), two section-heading
  sizes (`text-xl font-bold` and `text-lg font-semibold`), and two link colours (`primary-600`,
  75 uses, and `primary-700`, 20). Each was resolved toward the majority rather than toward a new
  value, so the batch moves the outliers and leaves the bulk of the app untouched. `tracking-tight`
  is gone: it appeared on exactly the two association pages and nowhere else.
- **Cards and in-card rows get different hover treatments, deliberately.** A card that sits on
  the canvas lifts with a shadow; a row that already sits inside a card does not, because a
  shadow on a row inside a card reads as a mistake. Those rows change background instead
  (`hover:bg-surface`). Both use a property-specific transition at Tailwind's default 150ms, which
  is the brief's number — the association files' `transition-all duration-200` was both broader
  and slower than everything else in the app.
- **The decorative hover transform is removed, not kept as a nicety.** `group-hover:translate-x-1`
  on a chevron is animation that carries no information — the chevron is already there and
  already turns blue on hover. The brief rules out decorative animation, so it went. The colour
  change stays, which is what actually signals the row is clickable.
- **`&rarr;` becomes `ArrowRight` in the public cards too.** The approved plan had this for the
  register-team glyphs only, but the same text arrow is used as a card's call to action on all
  four public surfaces, and `AssociationsList` already uses a lucide chevron for the same job. The
  words are unchanged; only the arrow stops being a text character.
- **Opacity modifiers on theme tokens are gone from the public and manage pages — but not from
  `src/`.** `border-border/80` and friends appeared only in the two association files. The palette
  already has `border` and `border-strong` for exactly this, and a half-opacity border is a third
  value nobody chose — it was a side effect of writing `border-border/80` by habit. Plain tokens
  keep the palette the only place a colour decision lives. **Corrected:** this entry originally said
  "not used anywhere now", which was wrong. `register-team/` still has seven of them
  (`bg-canvas/50` ×3, `border-border/80` ×3, `bg-primary-50/50`, `border-warning-border/60`), and
  they belong to that area's own pass. Two `bg-ink/40` scrims also remain, deliberately.
  **Now resolved:** that pass is done, and `src/` has no opacity modifier on a theme token left.
  There were eight occurrences, not seven, across two files: `bg-canvas/50` + `border-border/80`
  on three inset panels in `RequestDetails`, and `bg-primary-50/50` plus `border-warning-border/60`
  in `ReviewRequestsPage`'s request row. None of them needed a new palette value — `canvas` and
  `border` already exist for exactly those jobs. The two `bg-ink/40` scrims stay, for the reason in
  the entry below.
- **The manage batch is four commits, and the split is by area rather than by kind of change.** The
  public pass could be one commit because its decisions were cross-cutting — the same two title
  sizes, the same two link colours, the same hover rule on every page. The manage area has no such
  uniformity: each form needed its own judgement about which of the four input vocabularies it
  should land on, and two centred titles turned out to be deliberate rather than drift. Four diffs
  a reviewer can hold in their head beat one diff of seventeen files.
- **The four input vocabularies were resolved onto the largest one, not onto a new one.** The
  canonical `px-4 py-3` input had 13 uses and every form outside the player pages; the compact
  `px-3 py-1.5` one had 14 uses but only in two files. That is majority *plus context* rather than
  raw count: the compact one was also the only input in the app with no background and no focus
  ring, so it was the outlier on more than frequency.
- **`text-sm` on an input or a select is treated as a defect, not a style choice.** A 14px form
  control makes iOS Safari zoom the page when it takes focus, which the brief's mobile requirements
  rule out. `text-sm` on a *button* or a link is fine and stays — the zoom behaviour applies only to
  form controls. This is why the manage pass removes `text-sm` from inputs and selects but leaves it
  on the buttons beside them.
- **A dialog keeps `shadow-md`; a card does not.** The two format panels (`CreateSectionPage`,
  `ManageSectionPage`) sit on a `bg-ink/40` scrim, so they need to lift further than a card on the
  canvas; `ClubSearch`'s dropdown is the same case. The rule that fell out of 5b is one shadow step
  per *elevation*, not one shadow for the whole app — the mistake the `EditClubPage` form card made
  by using `shadow-md` while sitting flat on the canvas like every other card.
- **A scrim keeps its opacity modifier, because there the transparency is the effect.** An opaque
  overlay would hide the page it is meant to sit over. Called out because `bg-ink/40` looks like
  exactly the thing the public pass removed.
- **The button cursor is fixed in the stylesheet, not per button.** Tailwind v4's preflight dropped
  v3's `button { cursor: pointer }`, so every button in the app showed an arrow. Twelve
  `cursor-pointer` utilities had accumulated in `register-team/` as a workaround. One
  `button:not(:disabled) { cursor: pointer }` in `@layer base` replaces all twelve and fixes the
  buttons elsewhere that nobody had noticed. It is the only stylesheet change in the batch, and one
  line to revert. `<label>`s acting as rows keep their own `cursor-pointer`, since the selector
  cannot reach them.
- **The register-team shells keep their card and gain phone gutters.** The brief freezes layout, so
  the pages are not restructured into container + card. `mx-4 my-8 … sm:mx-auto` is the one
  addition — it is what the earlier AdminPage request asked for, and it stops the card touching the
  screen edge on a phone. `shadow-md` → `shadow-sm` because the card sits on the canvas; `my-10` →
  `my-8` to match the rest of the app; `font-sans` and `text-ink` dropped as already set on `body`.
- **`rounded-full` is a pill beside a heading; `rounded-md` is a tag under a title.** Both shapes
  are in use and both are deliberate. A count or status pill at the end of a heading row
  (`ml-auto`, `justify-between`) is `rounded-full` — the register-team chips, the `FixtureCard`
  score chip, the three `bg-primary-50` badges. An inline metadata tag sitting *under* a card title
  (`ClubsPage`, `PlayersPage`, `ManagePlayersPage`, `PlayerProfilePage`) is `rounded-md`. The two
  association count pills were the only ones on the wrong side of that line, moved to `rounded-md`
  in the public pass and put back in `2b299ca`.
- **The compact back chip is a deliberate third button size.** `px-3 py-1.5 text-xs` with the
  secondary colours, used for the four header back buttons in `register-team/`. It is smaller than
  the secondary button because it sits beside a title rather than in a form's action row, and
  growing it would crowd the heading at 320px. Phase 6 owns whether it stays (see the open
  question above).
- **`+ Add <thing>` is a text link, not a bordered button.** `FormatForm`'s `+ Add rubber` and
  `Registration`'s `+ Add Player` both add another row to a form, and both now render as
  `inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline` with a
  lucide `Plus`. Two affordances doing the same job now look like each other, and the `+` stops
  being a text character.
- **A dead hover is fixed, not normalised.** `RequestDetails`' approve and deny buttons had
  `hover:bg-success` on a base `bg-success` — the same value, so the hover did nothing. Both now
  put the whole background inside the enabled/disabled ternary and hover with `hover:opacity-90`.
  Worth stating because the tempting fix — leaving the base background and adding a conditional one
  — does not work: Tailwind resolves conflicting utilities by stylesheet order, not by the order
  they appear in the class attribute, so the result would depend on which utility Tailwind happened
  to emit last.
- **A dropdown panel is the third thing that keeps `shadow-md`.** The two search panels in
  `Registration` (club and player) float above the form, like the format dialog and `ClubSearch`'s
  listbox. Their option rows also lose `text-sm` and `text-ink-muted`: a listbox row is a choice to
  read, not a disabled control, and `px-4` lines the row text up with the input text above it.
- **5b's radius note is corrected: controls are `rounded-lg`, not `rounded-md`.** The 5b entry above
  reads "`rounded-md` (6px) for controls (inputs, buttons, chips), `rounded-lg` (8px) for
  surfaces". That was a description of what the 5b transform produced, not a decision it made — it
  collapsed bare `rounded` (4px) up to `rounded-md` and left everything else where it was, so the
  app went into the per-area passes with a mix. The manage and register-team passes standardised
  form controls on `rounded-lg`, and the current counts are 52 to 6 for inputs and 29 to 8 for
  buttons. The matches batch followed the code rather than the note. Four controls still on
  `rounded-md` are listed in Open questions.
- **`rounded-md` stays for inline banners, and the matches area is the reference for them.**
  `rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger` and its warning
  twin appear in `LoginPage`, `EnterResultPage`, `ResultStatusPanel`, `ScoresheetForm` and the
  dispute panel. They are messages inside a form rather than surfaces or controls, they already
  agree with each other across five files, and the manage pass deliberately left them alone. Noted
  because a radius sweep that went by majority alone would have moved them to `rounded-lg`.
- **A compact button is a size, not a fourth vocabulary.** The inline actions in
  `ResultStatusPanel` (Confirm, Dispute, Cancel, Dispute and enter) and `FixtureCard`'s "Enter
  result" keep `px-3 py-1.5 text-sm` because they sit in a status row or a card corner rather than
  in a form's action row. Everything else about them — `rounded-lg`, `font-medium`, the primary and
  secondary colours, `disabled:opacity-50` — is the shared vocabulary. The alternative was a
  `px-6 py-3` button inside a one-line status strip, which would have set the row's height on its
  own. The 44px target question for these is in Phase 6.
- **The scoresheet's submit is a form action and takes the full-size primary button.** It is the
  one button in the area that ends a form, so it is `px-6 py-3 rounded-lg font-medium` like the
  other form submits in the app, not the compact size used around it.
- **The last two `text-sm` form controls are gone.** `RubberRow`'s `inputClass` and
  `tiebreakClass` were the only sub-16px inputs left after the manage and register-team passes,
  and they were the reason the rule exists: a control under 16px makes iOS Safari zoom the viewport
  when it takes focus. The tiebreak boxes keep `w-12`; a two-digit score still fits at 16px.
- **A pre-existing not-found claim is corrected.** The manage-pages section said the remaining
  not-found work was `MatchResultsPage` and `EnterResultPage`. Both already used the contained,
  `text-ink-muted` shape the manage pass settled on, so the matches batch only dropped a dead
  `mb-4`.
