# Task 5 — API Integration and Front-End Interaction

Built on top of the completed Task 4 project (Tasks 1–4 are fully preserved
and untouched). Task 5 adds a real, self-contained REST API and a new
`/task5` front end that talks to it, demonstrating the three official
requirements:

1. Create RESTful API endpoints on the server for handling CRUD operations.
2. Develop a front-end interface that interacts with your own server API.
3. Fetch and display data from your API on the front end.

## What was added

### New files

- `server/controllers/api.expenses.controller.js` — the REST API's CRUD logic.
- `server/routes/api.expenses.routes.js` — the API's route definitions.
- `server/controllers/task5.controller.js` — renders the Task 5 page shell.
- `server/routes/task5.routes.js` — `/task5` and `/task5/expenses` page routes.
- `server/views/task5/shell.ejs` — the Task 5 page (loading / empty / error
  states, add/edit form, live expense table).
- `client/js/task5-expenses.js` — all `fetch()`-based CRUD logic.
- `client/css/task5.css` — styling scoped to `/task5/*`, reusing the CSS
  variables and `.panel` / `.app-table` / `.category-pill` classes already
  defined in `client/css/task3.css`.
- `internship/task-5/README.md` (this file)

### Modified files

- `server/app.js` — mounts `apiExpensesRoutes` at `/api/expenses` and
  `task5Routes` at `/task5`, and adds two small pieces of JSON-only error
  handling scoped to `/api` (see [Error handling](#error-handling) below).
  No existing mounts, middleware, or handlers for Tasks 1–4 were changed.
- `server/services/tempStore.js` — **additive only**. Added
  `getExpenseById()`, `updateExpense()`, `deleteExpense()`. The existing
  `addExpense()` and `getAllExpenses()` used by Tasks 1–4 are untouched.
- `server/views/task4/partials/navbar.ejs` — added one extra nav link to
  `/task5`. Since the link's `href` doesn't start with `/task4`, Task 4's
  client-side router (`isInternalRouterLink()` in `task4-app.js`) ignores
  it automatically — it's a normal full navigation, and nothing about
  Task 4's routing behavior changed.

### Untouched (preserved)

- Everything under `/`, `/task2`, `/task3`, and `/task4` — routes,
  controllers, views, validation, and the Task 4 client-side router.
- `client/css/style.css`, `client/css/task3.css`, `client/css/task4.css`.
- `server/utils/validators.js` — Task 5 **reuses**
  `validateExpenseInput()` exactly as written for Task 1–4; nothing in
  this file was changed.

## Architecture

Task 5 deliberately does **not** hook into Task 4's AJAX-fragment router
(`#app-content` swapping). It's a standalone page that does its own
`fetch()` calls directly against the REST API. The actual data flow is:

```
Browser
  -> fetch() in client/js/task5-expenses.js
  -> Express REST API (server/routes/api.expenses.routes.js)
  -> server/controllers/api.expenses.controller.js
  -> server/services/tempStore.js (the SAME in-memory store Tasks 1–4 use)
  -> JSON response
  -> DOM update (no full-page reload)
```

Because the API operates on the exact same `tempStore` module as every
earlier task, data flows both ways: an expense added through the old
`/task4/expenses` form appears in `GET /api/expenses`, and an expense
created through the Task 5 API appears in the Task 4 dashboard totals.
This was verified directly (see [Testing](#testing) below) — it is not
two separate data sets that happen to look similar.

## API endpoints

All endpoints are mounted at `/api/expenses` and always respond with JSON
(including on 404s and 500s — see [Error handling](#error-handling)).

| Method | Endpoint                        | Description                              | Success | Failure |
|--------|----------------------------------|-------------------------------------------|---------|---------|
| GET    | `/api/expenses`                 | List all expenses, newest first           | 200     | —       |
| GET    | `/api/expenses/meta/categories` | List the valid expense categories         | 200     | —       |
| GET    | `/api/expenses/:id`             | Get a single expense                      | 200     | 400 (bad id), 404 (not found) |
| POST   | `/api/expenses`                 | Create an expense                         | 201     | 400 (validation) |
| PUT    | `/api/expenses/:id`             | Replace an expense                        | 200     | 400 (bad id/validation), 404 |
| PATCH  | `/api/expenses/:id`             | Partially update an expense               | 200     | 400 (bad id/validation), 404 |
| DELETE | `/api/expenses/:id`             | Delete an expense                         | 200     | 400 (bad id), 404 |

**Request/response format:** JSON in, JSON out. Example create request:

```
POST /api/expenses
Content-Type: application/json

{ "title": "Groceries", "amount": 450, "category": "Food", "date": "2026-08-20" }
```

Example success response:

```json
{
  "data": { "id": 1, "title": "Groceries", "amount": 450, "category": "Food", "date": "2026-08-20", "createdAt": "...", "updatedAt": null },
  "message": "Expense created."
}
```

Example validation-error response (`400`):

```json
{
  "error": "Validation failed.",
  "errors": { "amount": "Amount must be a positive number." }
}
```

`PUT` and `PATCH` share one handler: the request body is merged onto the
existing record (so `PATCH` only needs to send the fields that changed),
the **merged** result is validated with the same rules as `POST`, and
only a fully valid result is saved. An id must be a positive integer
(`/^\d+$/`) or the request is rejected with `400` before ever touching
the store.

## Error handling

- **Validation errors** (`POST`/`PUT`/`PATCH` with bad data) → `400` with
  a field-by-field `errors` object, reusing `validateExpenseInput()` from
  `server/utils/validators.js` — the exact same rules Tasks 1–4 already
  enforce, so Task 5 does not introduce a second, divergent set of rules.
- **Bad id format** (non-numeric, decimal, negative) → `400`.
- **Missing resource** (well-formed id, no matching expense) → `404`.
- **Malformed JSON body** (e.g. a client sends broken JSON) → `400` with
  `{"error":"Malformed JSON in request body."}`, not a crash or an HTML
  error page — `express.json()`'s parse error is caught by a small
  `/api`-scoped error handler in `server/app.js`.
- **Unknown `/api/*` route** → `404` JSON (`{"error":"API endpoint not
  found."}`), never the plain-text 404 that Task 1–4 page routes use.
- **Unexpected server error** → `500` JSON, logged server-side.

This mirrors the same "always JSON under `/api`" guarantee a real
front end needs: `client/js/task5-expenses.js` can always safely call
`response.json()`, no matter what went wrong.

## Front-end behavior

`client/js/task5-expenses.js` is vanilla JS, no framework, no local array
standing in for the server:

- **Load**: on page load, `GET /api/expenses` is called immediately. A
  spinner (`#loadingState`) is shown until it resolves, then either the
  table or an empty-state message (`#emptyState`) is shown, never both.
- **Add**: the form is client-side validated first (matches the server's
  rules closely, purely for instant feedback), then `POST /api/expenses`.
  On success the form resets, a "Expense added." toast flashes, and the
  list is reloaded from the API (not spliced in locally) so the UI always
  reflects what the server actually has.
- **Edit**: clicking the pencil icon on a row populates the same form in
  "Edit Expense" mode (a hidden `#editingId` field switches the submit
  handler to `PUT` instead of `POST`) and scrolls it into view. Cancel
  reverts to "Add Expense" mode.
- **Delete**: the trash icon asks for confirmation, then sends `DELETE`
  and reloads the list on success.
- **Errors**: any network failure or non-2xx response shows a dismissible
  message in `#apiErrorAlert` (network/server errors) or inline under the
  relevant field (`400` validation errors) — nothing fails silently.
- **No unnecessary reloads**: every action above happens via `fetch()`;
  the only full navigations are the initial page load and the navbar
  links to `/` and `/task4`.

## Routes

| Method | Route              | Description                                   |
|--------|--------------------|------------------------------------------------|
| GET    | `/task5`           | Task 5 live expenses page                       |
| GET    | `/task5/expenses`  | Same page, alternate URL                        |
| GET    | `/api/expenses`    | REST API — see [API endpoints](#api-endpoints) above |

## How to run

```bash
npm install
cp .env.example .env
npm start          # or: npm run dev  (nodemon, auto-restart)
```

Then open:

- `http://localhost:3000/task5` — the Task 5 API demo
- `http://localhost:3000/task4` — Task 4 (still fully functional, now with
  a "Task 5 API Demo" link in its navbar)
- `http://localhost:3000/`, `/task2/*`, `/task3/*` — Tasks 1–3, unchanged

## Testing

### Automated (run during development, results below)

Every endpoint and the shared-store behavior were exercised directly
against a running server with `curl`, including:

- Full CRUD lifecycle: create → list → get-by-id → partial update (PATCH)
  → full update (PUT) → delete → confirm-gone.
- Validation failures for empty title, non-positive amount, invalid
  category, invalid date — each returns `400` with per-field messages.
- Not-found handling: `GET`/`PUT`/`PATCH`/`DELETE` on a nonexistent id → `404`.
- Bad id formats (`abc`, `1.5`, `-1`) → `400`, never treated as `0` or
  silently coerced.
- Malformed JSON body → `400` JSON error, not a crash.
- Unknown `/api/*` path → `404` JSON, not the plain-text page 404.
- A failed `PATCH` (invalid data) leaves the original record unchanged —
  verified by re-fetching the record afterward.
- Deleting one expense out of several leaves the others intact and
  correctly indexed.
- **Cross-task shared store**: an expense POSTed through `/task4/expenses`
  (the old HTML form) appeared in `GET /api/expenses`, and an expense
  created through the API was reflected in the Task 4 dashboard's total —
  confirming Task 5 reads/writes the same data Tasks 1–4 do, not a
  separate copy.
- Regression pass on Task 1–4: every existing page route still returns
  its expected status, Task 2/Task 4 signup and login flows still work,
  Task 4's AJAX fragment responses (`X-Requested-With: XMLHttpRequest`)
  are still valid JSON with the correct `activePage`.

### Manual checklist

- [ ] Visit `/task5` directly — loading spinner appears briefly, then
      either the table or "No expenses yet."
- [ ] Add an expense with valid data — it appears in the table instantly,
      no page reload, success message flashes and fades.
- [ ] Try submitting the add form empty — inline errors appear under each
      field, nothing is sent to the server (client-side check catches it
      first).
- [ ] Click the pencil icon on a row — form switches to "Edit Expense",
      fields pre-fill, a "Cancel" button appears.
- [ ] Change a value and save — table updates in place, form resets to
      "Add Expense" mode.
- [ ] Click "Cancel" mid-edit — form clears back to "Add Expense" mode
      without saving anything.
- [ ] Click the trash icon — a confirm dialog appears; confirming removes
      the row without a page reload.
- [ ] Click "Refresh" — re-fetches from the API (useful after testing the
      API directly with curl/Postman in another window).
- [ ] Stop the server, click "Refresh" or submit the form — the red error
      banner appears with a clear message instead of the page hanging or
      failing silently.
- [ ] Confirm `/`, `/task2/*`, `/task3/*`, and `/task4/*` all still behave
      exactly as they did before Task 5 was added.
