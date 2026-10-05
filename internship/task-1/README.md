# Task 1 — HTML Structure and Basic Server Interaction

## What this task demonstrates
- HTML/EJS form for user input (`server/views/expenses/task1-form.ejs`)
- A Node.js + Express server (`server/app.js`)
- A server-side POST endpoint handling the form submission (`server/routes/task1.routes.js`, `server/controllers/task1.controller.js`)
- Server-side rendering of the response using EJS (`server/views/expenses/task1-result.ejs`)

## Files involved
- `server/app.js`
- `server/config/env.js`
- `server/controllers/task1.controller.js`
- `server/routes/task1.routes.js`
- `server/views/expenses/task1-form.ejs`
- `server/views/expenses/task1-result.ejs`
- `server/views/partials/head.ejs`
- `client/css/style.css`

## Flow
Browser loads `GET /` → EJS renders the form → user submits → `POST /quick-add` →
Express controller reads `req.body` → EJS renders a result page showing exactly what
the server received, including a server-generated timestamp (proof the server, not the
browser, produced this page).

## Deliberately not included yet
- No input validation (added in Task 2)
- No persistent or temporary storage (temporary storage added in Task 2, MongoDB in Task 6)
