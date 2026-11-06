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

- **Presentation tier**: Keep React pages and shared API-client code in `octofit-tracker/frontend/src`. The browser calls relative `/api` paths through Vite; the frontend owns rendering and accessible loading, empty, and error states, not persistence or business rules.
- **Logic tier**: Keep request validation, business rules, and response shaping in Express routes/services under `octofit-tracker/backend/src`. Return deliberate 4xx responses for invalid or unknown references instead of exposing database cast errors.
- **Data tier**: Keep persistence constraints in Mongoose models under `octofit-tracker/backend/src/models` and representative, repeatable fixture creation in `src/scripts/seed.ts`. MongoDB remains on port `27017`.
- **Activity tracking**: Validate the submitted user and team IDs and confirm both records exist before creating an activity. Store the user, team, type, and minutes with computed points and an occurrence date.
- **Team management**: Require a team name, preserve the submitted name and mascot, and keep member references as IDs.
- **Leaderboard**: Aggregate activity points by team, sort highest first, and assign 1-based ranks in the API response.
- **Workout suggestions**: Match the requested email to a user, use that user's goal and recent activities to rank relevant workouts, and include an explanatory reason. Return a deliberate 4xx when no user matches.
- **Authentication**: Out of scope for this exercise; leave it as a follow-up challenge.

### Safe implementation order

Make each step a small test-driven change: implement one model rule, endpoint behavior, or page state at a time; run its focused contract test, then its tier suite before moving on.

1. Complete the data-model contracts one model at a time: user, team, activity, then workout. These schemas are prerequisites for reliable API input and persistence.
2. Verify the seed contract after the schemas are in place. Keep seeding idempotent and preserve unrelated existing records.
3. Implement API slices: teams first, then activity creation/listing (which depends on users and teams), then the leaderboard (which depends on stored activity points), then workout suggestions (which depend on users, activities, and workouts).
4. After the corresponding API behavior is established, implement the frontend one route and one state at a time: loading, empty, API error, and populated data. Keep API calls in the shared client and presentation in the React tier.
5. Run both tier builds and all three contract suites after the feature slices are complete. Keep the configured MongoDB, API, and Vite ports unchanged.

## Test plan

Latest validation: 2026-11-06. Initial failures were addressed by adding schema validation, implementing the API service behavior, and wiring the frontend routes to display API loading, empty, error, and success states.

- **Data tier** — `npm run test:data --prefix octofit-tracker/backend`: passed (5 tests), including repeatable seeding without deleting unrelated records.
- **API** — `npm run test:api --prefix octofit-tracker/backend`: passed (4 tests), covering activity validation and creation, teams, leaderboard ranking, and personalized workout suggestions.
- **Backend suite** — `npm test --prefix octofit-tracker/backend`: passed (9 tests across 2 files).
- **Frontend** — `npm test --prefix octofit-tracker/frontend`: passed (15 tests), covering populated data and loading, empty, and error states on all four routes.
- **Backend build** — `npm run build --prefix octofit-tracker/backend`: passed.
- **Frontend build** — `npm run build --prefix octofit-tracker/frontend`: passed, including TypeScript checking and Vite production bundling.
