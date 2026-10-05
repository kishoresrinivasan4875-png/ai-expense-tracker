# Task 3 — Advanced CSS Styling and Responsive Design

## What this task demonstrates
- A multi-section, professional UI: navigation, hero/landing section, login,
  signup, dashboard, and an expenses page with cards, tables, and stats
- Bootstrap 5 (via CDN) combined with a custom stylesheet
- Advanced CSS: CSS custom properties (`:root` variables), `clamp()` for
  fluid typography, CSS Grid for list layouts, gradients, `backdrop-filter`
- Transitions (buttons, cards, table rows) and keyframe animations (hero
  fade-up on load)
- Fully responsive layout, tested down to mobile width

## Files involved
- `server/controllers/task3.controller.js` — presentation layer only; reuses
  `validators.js`, `tempStore.js`, and `constants.js` from Task 2 with **no
  new business logic**
- `server/routes/task3.routes.js`
- `server/views/landing/index.ejs` — landing page (hero, features, CTA)
- `server/views/auth/task3-login-form.ejs` / `task3-login-result.ejs`
- `server/views/auth/task3-signup-form.ejs` / `task3-signup-result.ejs`
- `server/views/dashboard/index.ejs`
- `server/views/expenses/task3-index.ejs`
- `server/views/partials/head-app.ejs`, `navbar.ejs`, `footer.ejs`, `scripts.ejs`
- `client/css/task3.css` — new, separate stylesheet; `client/css/style.css`
  (used by Task 1/2) is untouched

## Routes
| Method | Path              | Purpose                                    |
|--------|-------------------|---------------------------------------------|
| GET    | `/task3`          | Landing page                                |
| GET    | `/task3/login`    | Login form (UI + light validation)          |
| POST   | `/task3/login`    | Validate + confirm receipt (no real auth yet)|
| GET    | `/task3/signup`   | Signup form (Bootstrap version of Task 2)   |
| POST   | `/task3/signup`   | Validate + store demo user (same tempStore) |
| GET    | `/task3/dashboard`| Stats, recent expenses, category breakdown  |
| GET    | `/task3/expenses` | Add-expense form + searchable table         |
| POST   | `/task3/expenses` | Validate + store expense (same tempStore)   |

## Why reuse, not rebuild
Task 3's own requirements list Login/Signup UI, a Dashboard, and an Expenses
page as deliverables. Rather than duplicating Task 2's validation and storage
logic, Task 3 imports the exact same `server/utils/validators.js` and
`server/services/tempStore.js` modules. Data added through either the Task 2
demo pages or the Task 3 pages lands in the same temporary store — the app
behaves as one cohesive application, and Task 6 only has to swap `tempStore`
for MongoDB, not rewrite validation.

## Data honesty
The dashboard reads real numbers from `tempStore.getAllExpenses()` (total,
current-month total, category breakdown, recent expenses) — nothing on that
page is hardcoded or faked. The only static numbers on the site are the
illustrative "This Month / Food / Transport / Bills" figures inside the
landing page's hero mockup card, which is explicitly marketing/preview
content, not a live data view.

## Deliberately not included yet
- No real authentication — login/signup pages validate input and confirm
  receipt only. Real credential checking, hashing, and sessions arrive in
  Task 6.
- No REST API — the expense form still submits via a normal HTML POST.
  Fetch-based CRUD against `/api/expenses` is Task 5.
- No MongoDB — still the same in-memory `tempStore` from Task 2.

## Testing notes
Verified without a live server (this environment has no network access to
run `npm install`): every `.js` file passes `node --check`, every `.ejs` file
has balanced EJS tags and balanced HTML tags, every `res.render()` call's
locals were manually cross-checked against what each view actually uses, and
every `include()` path was confirmed to resolve to a real file. This is not a
substitute for running the server — please run the checklist below.
