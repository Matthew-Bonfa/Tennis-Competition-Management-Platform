# Frontend Refactor — Progress

Branch: `feature/frontend/refactor`
Scope: visual + structural refactor of `frontend/` only. No functional, route, API, state or
copy changes. Verification per phase: `npm run build` and `npm run lint` in `frontend/`.

**Next step:** Phase 1 — restructure `src/` into `pages/`, `components/{layout,ui}/`, `lib/`
(see the target structure below). Phase 0 is complete: the build is green.

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
| `index.html` title | Change `frontend` → **`Waverley Tennis`**. |

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

## Target structure

```
src/
  App.tsx  main.tsx  index.css          # index.css = Tailwind + @theme + base only
  pages/
    HomePage.tsx  LoginPage.tsx  AdminPage.tsx
    associations/  AssociationsPage  AssociationProfilePage  AssociationsList
    clubs/         ClubsPage  ClubProfilePage
    competitions/  CompetitionsPage  CompetitionProfilePage  SectionPage
    players/       PlayersPage  PlayerProfilePage  PlayerStats
    teams/         TeamProfilePage  TeamRecordCard
    matches/       MatchResultsPage  EnterResultPage  MatchDetail  UpcomingMatches
                   FixtureCard  FixtureList  LadderTable  RoundSelector
                   ExportFixturesControl  ResultStatusPanel  RubberRow  ScoresheetForm
    manage/        associations/  clubs/  competitions/  players/
    register-team/ RegisterTeamPage  SelectCompetitionPage  ReviewRequestsPage
                   Registration  RequestDetails
  components/
    layout/        Header  MobileNav  PageContainer  PageHeader  BackButton
    ui/            Button  Input  Select  Textarea  Field  Card  Badge  Alert
                   SearchInput  EmptyState  LoadingState  Table  StatTile
  lib/             api  auth  exportLinks  playerRecord  teamRecord
                   formatName  scoresheet  types
  assets/          WaverleyLogo.png (+ unused template leftovers, kept)
  mock-data/
```

Naming rule: route-level components get a `Page` suffix; non-route sub-components keep
their descriptive name. Files are **moved**, and renamed only where the rule above requires it.

## CSS migration

| File | Action |
|---|---|
| `src/index.css` | Kept as the only stylesheet: Tailwind import + `@theme` + short `@layer base`. Remove the `#root { width: 1126px; border-inline; text-align: center }` rule and the 18px root font-size — the fixed width is why the layout can't breathe. |
| `src/App.css` | **Delete.** Imported by nothing; all classes unused Vite-template leftovers. |
| `src/Ribbon.css` | **Delete.** Becomes Tailwind utilities on `components/layout/Header.tsx`; the bare global `nav {}` selector is removed. |

---

## Checklist

### Phase 1 — Restructure (no visual change)
- [ ] Create `pages/`, `components/layout/`, `lib/`
- [ ] `git mv` all files to the target tree per the naming rule
- [ ] Rewrite every relative import to its new location
- [ ] `npm run build` + `npm run lint`
- [ ] Commit

### Phase 2 — Theme and global CSS
- [ ] Add `@theme` tokens (palette, fonts, radii) to `index.css`
- [ ] Add `@layer base`: page background, font stack, `:focus-visible` ring, `body { margin: 0 }`
- [ ] Remove `#root` width/border/centering and the 18px root font-size
- [ ] Delete `App.css` and `Ribbon.css`; update `main.tsx`
- [ ] Build + lint + commit

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
