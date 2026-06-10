# FE Master Roadmap for `WDP301_HACKATHON_G04_FE`

## Summary

Build the FE roadmap against the **full backend target state in docs**, but implement in dependency-safe waves so early FE phases rely only on stable/current BE capabilities and later phases reserve clear extension points for unfinished BE modules.

The roadmap should be documented under `WDP301_HACKATHON_G04_FE/notes` as a small planning set, not one giant file:

- `notes/FE_MASTER_PLAN.md`: executive roadmap, phase order, dependency map
- `notes/FE_FEATURE_MATRIX.md`: screen-by-screen matrix by role and backend module
- `notes/FE_API_GAP_ANALYSIS.md`: current FE coverage vs BE docs/src, including blocked/missing endpoints
- `notes/FE_PERFORMANCE_QUALITY_PLAN.md`: test, performance, observability, and tooling plan

## Key Changes

### 1. Lock FE architecture and delivery rules first
Use the current `app / pages / widgets / features / entities / shared` structure as the non-negotiable base.

Add planning rules to the notes:

- `pages` stay thin and route-only
- `widgets` own screen composition
- `features` own user actions, forms, flow logic, and mutation hooks
- `entities` own domain DTOs, API wrappers, query key factories, and stable mappers
- `shared` only holds generic UI, low-level API client, and cross-domain utilities
- no new screen should be implemented directly in `pages`
- no domain-specific business logic should be added to `shared`

Also record a “minimal patch” policy for future FE work:
- prefer incremental edits over file rewrites
- preserve Vietnamese text exactly as authored
- avoid broad cleanup while implementing feature slices

### 2. Rationalize current FE library strategy before scaling features
Document that the current FE stack is sufficient for the roadmap, but needs discipline and a few additions.

Keep and standardize:
- `react-router`
- `@tanstack/react-query`
- `react-hook-form` + `zod`
- `zustand`
- `radix` + shared UI wrappers
- `sonner`

Constrain:
- avoid mixing `MUI` with `shared/ui` for new screens unless a missing component forces it
- avoid adding parallel form/state stacks
- avoid duplicating query logic inside large widgets

Plan to add:
- `vitest` + `@testing-library/react` + `@testing-library/user-event`
- `msw` for API mocking
- `vite-plugin-checker` for parallel type/lint feedback during dev
- `@tanstack/react-query-devtools` for local debugging only
- optional bundle analysis tool such as `rollup-plugin-visualizer`

Plan to add scripts/interfaces:
- `typecheck`
- `lint`
- `test`
- `test:watch`
- `analyze`
- optional `test:e2e` later if Playwright is approved

### 3. Implement by backend-safe waves, not by random screens
Use this phase order in `FE_MASTER_PLAN.md`.

**Phase 0: FE Foundation Hardening**
- add query key conventions, API mapper conventions, permission gate conventions, and role-route matrix
- replace current ad hoc mock usage on coordinator dashboard/results with explicit “mocked until API available” boundaries
- define global loading, empty, error, and unauthorized states
- add dev quality scripts and test harness before expanding screen count

**Phase 1: Auth, Session, and Event Context**
- stabilize auth, register, Google callback, password change, session bootstrap
- introduce selected-event context flow for all multi-event role screens
- define permission-aware navigation from backend permission codes, not only derived role names

**Phase 2: Core Competition Operations**
- coordinator event management
- participant approval/lifecycle
- team lifecycle, invitations, leader actions, track registration
- check-in flow
- timelines and workshops management
- track management
This phase should complete the “event can be configured and operated” FE base.

**Phase 3: Judge and Submission Flow**
- rounds management
- rubrics and criteria management
- judging boards assignment
- participant submission flow
- judge score sheet flow
- coordinator judging overview and score visibility
This phase depends on stable round/rubric/score-sheet APIs.

**Phase 4: Repository and GitHub Operations**
- GitHub config management
- repository creation and linking
- collaborator assignment/invite/revoke
- repository status and access visibility
- webhook/evidence/AI review read surfaces for coordinator and judge
Do not overbuild live monitoring UI until operations endpoints are confirmed.

**Phase 5: Results, Finalists, and Publication**
- rankings
- finalist selection
- result publication
- repository freeze/revoke visibility
- traceability/audit summaries tied to scoring outcomes

**Phase 6: Admin and Operations Console**
- admin settings/configuration
- notification visibility
- audit logs
- operational dashboards
- failed jobs/pipeline status summaries
This phase should align to BE operations/audit modules, not guessed UI.

**Phase 7: Experience and Performance Completion**
- remove remaining placeholder/mock metrics
- optimize query invalidation and cache scopes
- add list/table virtualization only where data volumes justify it
- refine mobile/tablet layouts for all role-critical screens
- add bundle and interaction-budget checks

### 4. Build a role-feature matrix from BE src, then implement by dependency
In `FE_FEATURE_MATRIX.md`, map each role to modules and screen families:

- `participant`: registration, team, media, submissions, workshop attendance, status visibility
- `coordinator`: events, participants, teams, tracks, timelines, workshops, check-in, repositories, judging, results, finalists, operations
- `judge`: assigned boards, teams, submissions, AI support views, score sheets, locked states
- `mentor`: team/repository read views, possibly workshop/timeline visibility
- `admin`: settings, media moderation, user/role/system configuration, audit/ops views

For each area, record:
- FE screen status: done / partial / missing
- BE module status: stable / partial / target-only
- blocker type: missing endpoint, shape mismatch, runtime dependency, or purely FE work

### 5. Add a concrete performance and quality plan, not just feature phases
In `FE_PERFORMANCE_QUALITY_PLAN.md`, define the implementation order for quality work:

- add route-level code splitting to every role area that is still bundled too broadly
- centralize query keys per entity to reduce accidental over-invalidation
- move heavy table/filter logic from widgets into feature/entity helpers
- normalize API responses in entity mappers before UI usage
- prefer optimistic updates only for low-risk local interactions
- keep upload/media flows resumable or at least failure-explained
- add skeletons and retry UX for slow BE modules such as repositories, judging, and media
- use React Query stale times by domain instead of one-size-fits-all
- add explicit error taxonomy for auth expiry, forbidden, validation, and transient server errors
- add smoke tests for each role-critical route and unit tests for feature-level mappers/validators
- add MSW-backed integration tests for auth, team invitation, scoring, repository config, and media moderation

## Test Plan

The roadmap should require these acceptance checks per wave:

- Foundation: `build`, `typecheck`, `lint`, and at least one rendered test pass
- Operations wave: event, participant, team, track, timeline, and workshop flows work with BE-aligned DTOs
- Judging wave: round selection, board scope, rubric load, score entry, save, submit, and locked-state handling
- Repository wave: config, repo creation, collaborator actions, revoke confirmation, and API error surfacing
- Results wave: ranking tables, finalist selection state, publish flow, and post-publication visibility
- Operations wave: audit/ops views load with empty/loading/error states and no mock leakage
- Final quality wave: bundle analysis run, no major screen exceeds acceptable chunk size without reason, and top role routes are manually smoke-tested on mobile and desktop

## Assumptions

- Planning target is the **full BE target state** from docs, not only currently polished endpoints.
- Delivery strategy is **balanced**: business capability first, but UX/performance rails are inserted early where they prevent rework.
- Notes are intended for internal project use under `WDP301_HACKATHON_G04_FE/notes`.
- New FE work should preserve the current Atomic + FSD direction and continue using the local guardrail skill.
- If a BE module exists in docs but not yet stable in runtime, the FE plan should reserve the screen and DTO boundary, but mark implementation as blocked rather than inventing fake contracts.
