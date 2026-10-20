# Frontend Refactor — Progress

Branch: `feature/frontend/refactor`
Scope: visual + structural refactor of `frontend/` only. No functional, route, API, state or
copy changes. Verification per phase: `npm run build` and `npm run lint` in `frontend/`.

**Next step:** Phase 3 — `Ribbon.tsx` → `components/layout/Header.tsx`: rewrite its styling as
Tailwind utilities, collapse the nav into a mobile menu below `md`, and add the
Log in / Log out button. **This is where `Ribbon.css` finally gets deleted** (deferred from
Phase 2 — see the note there). Phases 0–2 are complete: the build is green, `src/` is
restructured, and the theme tokens are in place.

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
  App.css  Ribbon.css                   # both deleted in Phase 2
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
    layout/        Ribbon  (→ Header in Phase 3)
    ui/            (added in Phase 4)
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
| `src/Ribbon.css` | **Delete in Phase 3.** Becomes Tailwind utilities on `components/layout/Header.tsx`; the bare global `nav {}` selector goes with it. | ⏳ Phase 3 |

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

### Phase 3 — Header, mobile nav, Log in button
- [ ] `Ribbon.tsx` → `components/layout/Header.tsx`, all styling as Tailwind
- [ ] Desktop nav bar; below `md`, collapse into a hamburger + panel
- [ ] 44px minimum touch targets; visible focus states
- [ ] Add Log in (signed out) / Log out (signed in) button — right side on desktop,
      inside the mobile menu on small screens; primary button styling
- [ ] Build + lint + commit

### Phase 4 — Shared UI primitives and responsive layout fixes
- [ ] Add thin `components/ui/*` primitives (className composition only, no behaviour change)
- [ ] Fix non-responsive grids: `grid-cols-4` (EditClubPage), `grid-cols-3` (PlayerStats,
      MatchResultsPage), `grid-cols-2` (RubberRow, FormatForm), `min-w-[280px]`
      (AssociationProfile) → mobile-first
- [ ] Wrap wide tables in scroll containers; reflow to cards on mobile where needed
- [ ] Make loading / empty states consistent (bare `<p>Loading...</p>` in ManagePlayersPage)
- [ ] Build + lint + commit

### Phase 5 — Page polish (batched, one commit each)
- [ ] 5a Public pages: Home, Competitions(+Profile, Section), Clubs(+Profile),
      Associations(+Profile, List), Players(+Profile, Stats), Teams, Admin
- [ ] 5b Manage pages: associations, clubs, competitions, players
- [ ] 5c `register-team/` — unify off `slate`/`blue`/`rounded-2xl`/`shadow-md` and the
      `←` `→` text glyphs onto the shared palette and lucide icons
- [ ] 5d `match-results/` — scoresheet, rubber rows, status panel

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
- **Auth state is not reactive.** `auth.ts` reads `localStorage` at call time and nothing
  subscribes to changes, so the header will not re-render on login/logout without a reload.
  Fixing that properly means new state management — out of scope unless asked.
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
