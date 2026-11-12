# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier**: Keep React pages and shared API-client code in `octofit-tracker/frontend/src`. Browser requests use relative `/api` paths through Vite's proxy; `VITE_API_BASE_URL` is an explicit override. Components render data and accessible loading (`role="status"`), error (`role="alert`), and empty states. They do not own persistence or business rules.
- **Logic tier**: Keep input validation, business rules, and response shaping in Express routes/services under `octofit-tracker/backend/src`. Validate request shapes and ObjectId syntax before database lookups, and return deliberate 4xx responses for invalid input or missing referenced users/teams rather than leaking cast errors.
- **Data tier**: Keep required fields, references, and field-level constraints in Mongoose models under `octofit-tracker/backend/src/models`. The seed script upserts stable demo records and relationships; it must be safe to run repeatedly and must not clear unrelated application data. MongoDB remains on port `27017`.
- **Activity tracking**: Accept `userId`, `teamId`, `type`, and a finite positive `minutes` value. Verify that both referenced records exist before writing. Store the corresponding user/team references, trimmed type, minutes, computed points (currently one point per minute), and server-generated `occurredAt`.
- **Team management**: Require non-empty name and mascot values, trim them, and preserve both in responses. Members are user ID references; validate any supplied IDs and verify their users exist before creating the team. Omitted members default to an empty list.
- **Leaderboard**: Aggregate persisted activity points by team, order totals highest first, and assign sequential 1-based ranks in the API response.
- **Workout suggestions**: Match the supplied email without regard to case. Rank workouts by whether their focus matches the user's fitness goal and most recent activity (one point for each match); break ties by title and include a human-readable reason. A user with no matching email receives a deliberate 4xx response.
- **Authentication**: Out of scope for this exercise; leave it as a follow-up challenge.

### Safe implementation order

Make each step a small test-driven change: add or adjust the focused contract assertion, implement one model rule, endpoint behavior, or page state, and run the matching contract suite before moving on.

1. Complete the data-model contracts one model at a time: user, team, activity, then workout. These schemas are prerequisites for reliable API input and persistence.
2. Verify the seed contract after the schemas are in place. Keep seeding idempotent and preserve unrelated existing records.
3. Implement API slices: teams first, then activity creation/listing (which depends on users and teams), then the leaderboard (which depends on stored activity points), then workout suggestions (which depend on users, activities, and workouts).
4. After the corresponding API behavior is established, implement the frontend one route and one state at a time: loading, empty, API error, and populated data. Keep API calls in the shared client and presentation in the React tier.
5. Run both tier builds and all three contract suites after the feature slices are complete. Keep the configured MongoDB, API, and Vite ports unchanged.

## Test plan

Run the focused contract suite after each change, then run all tier suites and builds before considering the implementation complete. Backend contract tests use an in-memory MongoDB; they do not require a separate MongoDB service.

| Area | Command | Acceptance criteria |
| --- | --- | --- |
| Data models and seed | `npm run test:data --prefix octofit-tracker/backend` | Required model fields and defaults validate; seed creates linked fixtures, is repeatable, and preserves unrelated users, teams, activities, and workouts. |
| API behavior | `npm run test:api --prefix octofit-tracker/backend` | Activity creation rejects malformed or missing references without a 5xx and returns stored points/date; teams preserve names, mascots, and valid members; leaderboard totals/ranks are correct; suggestions prioritize goal/activity matches and unknown users receive a 4xx. |
| Backend regression | `npm test --prefix octofit-tracker/backend` | Both backend contract files pass together. |
| Frontend behavior | `npm test --prefix octofit-tracker/frontend` | All four routes render populated responses and accessible loading, empty, and API-error states; workout suggestions request the expected user. |
| Backend type check | `npm run build --prefix octofit-tracker/backend` | TypeScript compilation succeeds. |
| Frontend type check and production bundle | `npm run build --prefix octofit-tracker/frontend` | TypeScript compilation and Vite production bundling succeed. |

Latest recorded validation: 2026-11-12. Backend suite: 9 tests passed across 2 files (5 data, 4 API); frontend suite: 15 tests passed. Both tier builds passed.
