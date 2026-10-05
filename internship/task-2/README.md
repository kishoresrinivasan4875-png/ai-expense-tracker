# Task 2 — Inline Styles, Basic Interaction, and Server-Side Validation

## What this task demonstrates
- More complex forms and user interaction (Add Expense form, Signup form)
- Inline JavaScript for client-side validation, embedded directly in each
  EJS view's `<script>` block (not a separate app-wide validation file)
- Independent server-side validation that never trusts the browser
  (`server/utils/validators.js`)
- Temporary server-side storage, explicitly in-memory and non-persistent
  (`server/services/tempStore.js`)

## Files involved
- `server/utils/constants.js` (shared category list — also used by Task 1, avoids duplication)
- `server/utils/validators.js` (shared validation rules — reused by Task 6 later)
- `server/services/tempStore.js` (temporary in-memory storage)
- `server/controllers/task2.controller.js`
- `server/routes/task2.routes.js`
- `server/views/expenses/task2-add-form.ejs`
- `server/views/expenses/task2-list.ejs`
- `server/views/auth/task2-signup-form.ejs`
- `server/views/auth/task2-signup-result.ejs`
- `client/css/style.css` (extended, not duplicated, for error/empty states)

## Routes
| Method | Path                | Purpose                                   |
|--------|---------------------|--------------------------------------------|
| GET    | `/task2/expenses/new` | Show the Add Expense form                |
| POST   | `/task2/expenses`     | Validate + store an expense (temp memory)|
| GET    | `/task2/expenses`     | List everything currently stored         |
| GET    | `/task2/signup`       | Show the signup validation demo form     |
| POST   | `/task2/signup`       | Validate signup data (no password stored)|

## Validation rules enforced (client AND independently on the server)
**Expense form**
- Title: required, non-empty
- Amount: required, must be a positive number
- Category: required, must be one of the 8 defined categories
- Date: required, must be a parseable date

**Signup form**
- Username: required, non-empty
- Email: required, must match a basic email format
- Password: at least 8 characters, containing at least one letter and one number
- Confirm password: must match password
- Duplicate email: rejected if already present in temp storage

## Why two forms?
The internship brief lists both expense-amount validation and password/email/confirm-password
validation as Task 2 requirements. Building the signup form's validation now means Task 6 only has
to add real password hashing and MongoDB persistence — the validation logic itself doesn't change.

## Deliberately not included yet
- No MongoDB — data lives in a JS array and resets on server restart
- No password hashing — the signup form proves validation only, not real account creation
- No authentication/session/login — that's Task 6
