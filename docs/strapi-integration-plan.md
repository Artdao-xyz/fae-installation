# Strapi integration plan

Replace fixture and hardcoded content with Strapi CMS responses while keeping the existing UI contracts (`ContentRow`, filter behavior, panels) unless the CMS model forces intentional changes.

## 1. Current data sources to replace

| Area | Location | Notes |
|------|----------|--------|
| Particle grid + `listContent` | `src/lib/content-repository.ts`, `src/data/content-fixture.ts` | Synthetic rows, picsum images |
| Sidebar search | `src/data/search-filter.ts` | Filters same fixture rows |
| Filter option labels | `src/data/content-taxonomy.ts` → `src/components/ui/filter-sidebar/config/constants.ts` | Static label lists |
| Glossary panel | `src/data/glossary-panel-content.ts` | `{ id, term, definition }[]` |
| Fellowships panel | `src/components/ui/fellowships-panel/FellowshipsPanel.tsx` | Thumbnails + picsum |
| About panel | `src/components/ui/about-panel/AboutPanel.tsx` | Body, team list, link placeholders |
| Hero | `src/app/page.tsx` | Title + subtitle strings |

## 2. Canonical frontend shape (main content)

`ContentRow` (`src/data/content-types.ts`):

- `id`, `title`, `imageUrl`, `content`, `resources[]`
- `focusAreas[]`, `activityTypes[]`, `formats[]`, `networks[]`
- `year` (number)

Strapi field names can differ; add a mapper layer that turns API JSON into `ContentRow` (or evolve the type if the CMS model cannot be expressed this way).

## 3. Information to collect from Strapi (before implementation)

- **Strapi version** (v4 vs v5) — response envelope and populate syntax differ.
- **Base URL(s)** for dev/staging/prod and whether the browser may call Strapi directly or only the Next.js server (CORS, token exposure).
- **Auth** — public GET vs API token; prefer server-side fetch with a secret token when possible.
- **Per collection**: REST path (or GraphQL), recommended `populate` / depth for nested media and relations.
- **Sample JSON** (one document each) for: main content type, any taxonomy types, glossary, fellowships, global/about singleton if used.
- **Taxonomy strategy** — separate collections vs enums vs components; whether filter chips should list **all published labels** or **values present in content**.
- **Search** — keep client-side filtering on a fetched set vs Strapi-side filters (`$containsi`, plugins, pagination).

## 4. Implementation phases

### Phase A — Environment and HTTP client

- Add env vars (e.g. `STRAPI_URL`, optional `STRAPI_API_TOKEN` for server-only use).
- Implement a small fetch helper (timeouts, errors, optional draft mode later).

### Phase B — Content listing and mapping

- Replace `listContent` implementation to call Strapi (or a Next.js Route Handler that proxies Strapi).
- Map Strapi media to `imageUrl` (absolute URL construction if Strapi returns relative paths).
- Map rich text / blocks to `content` string (Markdown, plain text, or HTML — align with how the preview/detail UI consumes it).
- Map relations or JSON fields to `focusAreas`, `activityTypes`, `formats`, `networks`, `resources`, `year`.

### Phase C — Search and filters

- Point `filterContentRowsForSearchQuery` at real data (same in-memory list as `listContent`, or refactor to a shared store/context populated once).
- Replace or derive `FOCUS_AREA_LABELS` (and siblings) from Strapi or from unique values on loaded content; ensure filter UI stays in sync with row data.

### Phase D — Panels and hero

- Load glossary, fellowships, and about copy from Strapi (or a single “site settings” single type) and thread props into existing components.
- Optional: move hero strings to the same singleton.

### Phase E — Cleanup

- Remove or narrow `content-fixture.ts`, `fixture-seed-titles.ts`, and unused taxonomy constants once unused.
- Add basic error/empty states where the UI currently assumes fixture length > 0.

## 5. Risks and decisions

- **Large payloads**: particle view may need pagination or a capped `limit`; confirm with design/engineering.
- **Rich text**: block JSON from Strapi may require a renderer instead of a single string — may change `ContentRow` or add a parallel field.
- **Client vs server fetch**: if `listContent` stays client-called, Strapi must allow browser origin or calls go through Next API routes.

## 6. Done when

- No production path reads `CONTENT_FIXTURE_ROWS` for real user flows.
- Filter search matches CMS-backed rows and taxonomy.
- Glossary, fellowships, and about content are editable in Strapi without code changes (if in scope).
- Env-based configuration documented in `.env.example` (create or update when vars are finalized).
