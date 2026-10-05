const express = require('express');
const path = require('path');
const env = require('./config/env');

const task1Routes = require('./routes/task1.routes');
const task2Routes = require('./routes/task2.routes');
const task3Routes = require('./routes/task3.routes');
const task4Routes = require('./routes/task4.routes');
const task5Routes = require('./routes/task5.routes');
const apiExpensesRoutes = require('./routes/api.expenses.routes');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsers so we can read form submissions (application/x-www-form-urlencoded)
// and JSON payloads (used by the Task 5 REST API).
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets (CSS/JS/images) served from /client
app.use(express.static(path.join(__dirname, '..', 'client')));

// ---- Task 1 routes ----
app.use('/', task1Routes);

// ---- Task 2 routes ----
app.use('/task2', task2Routes);

// ---- Task 3 routes ----
app.use('/task3', task3Routes);

// ---- Task 4 routes ----
app.use('/task4', task4Routes);

// ---- Task 5: REST API (JSON only) ----
// Mounted at the literal /api/expenses path required by the Task 5 spec,
// separate from the /task5 page routes below.
app.use('/api/expenses', apiExpensesRoutes);

// ---- Task 5: fetch-driven front-end page ----
app.use('/task5', task5Routes);

// ---- API-scoped JSON error handling ----
// Everything under /api must always get JSON back — even on a 404 or an
// unhandled crash — so the front-end's fetch() calls can always safely
// call response.json(). Page routes (Task 1-4) keep the plain-text
// handlers further below, unchanged.

// Unmatched /api/* routes (e.g. a typo'd path) -> JSON 404, not plain text.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Errors thrown by anything under /api/* -> JSON, never an HTML stack
// trace. A malformed JSON request body (caught by express.json() before
// our routes even run) is the client's fault, so it gets 400, not 500.
app.use('/api', (err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Unexpected server error.' });
});

// 404 handler (page routes)
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// Centralized error handler (page routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong on our end.');
});

app.listen(env.port, () => {
  console.log(`AI Expense Tracker server running at http://localhost:${env.port}`);
});
