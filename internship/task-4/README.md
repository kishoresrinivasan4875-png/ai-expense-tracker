# Task 4 — Complex Form Validation and Dynamic DOM Manipulation

Built on top of the completed Task 3 project (Tasks 1–3 are fully preserved
and untouched). Task 4 adds a new `/task4` section of the app that
demonstrates the three official requirements:

1. Enhance form validation to include more complex rules, such as password strength.
2. Dynamically update the DOM based on user interactions using JavaScript.
3. Implement client-side routing for a smoother user experience.

## What was added

### New files
- `server/controllers/task4.controller.js`
- `server/routes/task4.routes.js`
- `server/views/task4/shell.ejs` (full-page layout)
- `server/views/task4/partials/navbar.ejs`
- `server/views/task4/pages/*.ejs` (landing, login-form, login-result,
  signup-form, signup-result, dashboard, expenses — content fragments)
- `client/js/password-strength.js`
- `client/js/task4-app.js`
- `client/css/task4.css`
- `internship/task-4/README.md` (this file)

### Modified files
- `server/app.js` — mounts the new `/task4` router. No existing mounts,
  middleware, or handlers were changed.
- `server/utils/validators.js` — **additive only**. Added
  `checkPasswordStrength`, `isStrongPassword`, `PASSWORD_RULES`, and
  `validateSignupInputStrict`. The existing `isValidPassword` and
  `validateSignupInput` used by Task 2 and Task 3 are untouched, so those
  routes keep behaving exactly as before.

### Untouched (preserved)
- Everything under `/`, `/task2`, and `/task3` — routes, controllers,
  views, and their inline validation.
- `server/services/tempStore.js` — Task 4 reuses the same in-memory store,
  so expenses/users created in Task 2, Task 3, or Task 4 are all visible
  to each other (they share one server process's memory).
- `client/css/style.css` and `client/css/task3.css`.

## How each requirement was implemented

### 1. Complex validation — password strength

- **Server-side** (`server/utils/validators.js`): `checkPasswordStrength()`
  checks five independent rules — minimum 8 characters, an uppercase
  letter, a lowercase letter, a number, and a special character — and
  returns a 0–4 score plus a per-rule breakdown. `validateSignupInputStrict()`
  requires all five rules to pass before a Task 4 signup is accepted, on
  top of the existing username/email checks. This is the authoritative
  check: it runs on every `POST /task4/signup`, so validation cannot be
  bypassed by disabling JavaScript or calling the endpoint directly (e.g.
  via curl/Postman).
- **Client-side** (`client/js/password-strength.js` + `task4-app.js`): the
  signup form (`server/views/task4/pages/signup-form.ejs`) has a live
  strength meter — a colored bar (weak/fair/good/strong) and a five-item
  checklist that ticks off in real time as the user types, using the exact
  same five rules as the server. A live "passwords match" check and a
  show/hide password toggle are included for a complete, professional UX.
  Username and email fields also get lightweight real-time hints on blur.
- **Clear error/success states**: invalid submissions re-render the form
  with field-level Bootstrap `is-invalid` styling and inline error text
  (server-driven, so it's correct even without JS). Valid submissions
  render a distinct success/result page.

### 2. Dynamic DOM manipulation

Two interactions, both meaningful to an expense tracker (not generic demo
behavior), both handled entirely in the browser without a server round trip:

- **Live expense search + category filter with a running total**
  (`server/views/task4/pages/expenses.ejs` + `attachExpenseFilter()` in
  `task4-app.js`): typing in the search box or choosing a category
  instantly hides/shows table rows and recalculates a "Showing N expenses
  · Filtered total: ₹X" summary — no page reload, no server call.
- **Running-total preview while adding an expense**
  (`attachRunningTotalPreview()`): as the user types an amount into the
  "Add Expense" form, a line below the field updates live to show what the
  new total would be if that expense were added, calculated from the
  amounts already in the visible table.

Additionally, the AJAX-enhanced forms (`attachAjaxForms()`) submit via
`fetch` and swap only the relevant fragment of the page back in, so adding
an expense, logging in, or signing up updates the DOM in place instead of
forcing a full page reload — this is also what powers requirement 3.

### 3. Client-side routing

Every `/task4/*` page can render two ways from the exact same controller
and view:

- **Direct navigation / reload / no-JS**: a full HTML document via
  `server/views/task4/shell.ejs`, which includes the navbar, the page
  content, the footer, and scripts. This is what you get from typing a
  `/task4/...` URL directly, refreshing, or with JavaScript disabled.
- **AJAX navigation**: when a request carries `X-Requested-With:
  XMLHttpRequest`, the controller instead responds with JSON
  (`{ html, title, activePage }`) containing only the inner content
  fragment.

`client/js/task4-app.js` intercepts clicks on internal `/task4` links,
fetches them with that header, swaps the returned HTML into `#app-content`,
updates `document.title` and the active navbar item, and pushes the new
URL with `history.pushState`. A `popstate` listener re-fetches the route on
back/forward so browser history keeps working correctly. If a fetch ever
fails, the router falls back to a normal full navigation, so the app never
gets stuck — every route still works exactly as before if JavaScript is
unavailable, since every link is a real `<a href>` and every route also has
a working server-rendered version.

## Design notes / constraints followed

- No new dependencies were added — everything is vanilla JavaScript, the
  same Express/EJS stack used in Tasks 1–3.
- Task 4 does not touch or weaken any Task 1–3 route, controller, or
  validation rule. Task 2's `/task2/signup` and Task 3's `/task3/signup`
  still accept the original "8+ characters with a letter and a number"
  password rule, unchanged.
- Server-side validation remains the source of truth everywhere; all
  client-side checks are progressive-enhancement UX only.

## How to run

```bash
npm install
npm start
```

Server starts at `http://localhost:3000` (or `PORT` from `.env` if set).

## Routes to test

| Method | Route | What it does |
|---|---|---|
| GET | `/` | Task 1 quick-add form (unchanged) |
| POST | `/quick-add` | Task 1 submit (unchanged) |
| GET | `/task2/expenses` | Task 2 expense list (unchanged) |
| GET | `/task3` | Task 3 landing page (unchanged) |
| GET | `/task3/dashboard` | Task 3 dashboard (unchanged) |
| GET | `/task4` | Task 4 landing page |
| GET | `/task4/login` | Task 4 login form |
| POST | `/task4/login` | Task 4 login submit |
| GET | `/task4/signup` | Task 4 signup form with live password strength meter |
| POST | `/task4/signup` | Task 4 signup submit (strict password validation) |
| GET | `/task4/dashboard` | Task 4 dashboard (shares data with Task 2/3) |
| GET | `/task4/expenses` | Task 4 expenses page with live filter + running total |
| POST | `/task4/expenses` | Task 4 add-expense submit |

## Manual testing checklist

- [ ] Visit `/task4` directly (full page loads with navbar, hero, footer).
- [ ] Click "Get Started Free" — navigates to `/task4/signup` without a full
      page reload (watch the URL bar update, no white-flash reload).
- [ ] Type a weak password on signup — strength bar is red/"Weak", checklist
      items are unchecked.
- [ ] Type a strong password (e.g. `Str0ng!Pass`) — bar turns green/"Strong",
      all five checklist items check off.
- [ ] Type mismatched confirm-password — inline error appears live.
- [ ] Submit signup with a weak password — page re-renders in place (no
      reload) with a server-driven error under the password field.
- [ ] Submit a valid signup — success page renders in place.
- [ ] Try the same email again — "already exists" error shown.
- [ ] Go to `/task4/expenses`, add a valid expense — table updates and a
      success alert appears, no page reload.
- [ ] Submit the expense form with empty fields — inline errors appear,
      no reload.
- [ ] Type in the expense search box / pick a category — table rows filter
      instantly and the "Filtered total" updates.
- [ ] Type an amount in the Add Expense form — "New total after this
      expense" preview updates live.
- [ ] Use the browser Back/Forward buttons after navigating a few `/task4`
      pages — content updates correctly both ways.
- [ ] Reload on `/task4/dashboard` directly — full page still renders
      correctly (server fallback works).
- [ ] Confirm `/`, `/task2/*`, `/task3/*` still behave exactly as before.
