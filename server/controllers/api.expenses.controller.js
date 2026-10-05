// Task 5 controller — RESTful Expense API
//
// Implements complete CRUD over the SAME in-memory store used by Tasks
// 1-4 (server/services/tempStore.js). Nothing here is a fake/hardcoded
// response: every endpoint reads from or writes to tempStore, so an
// expense added on /task4/expenses shows up in GET /api/expenses, and an
// expense created through this API shows up on /task4/expenses too.
//
// Validation reuses the exact same validateExpenseInput() rules already
// proven in Task 1-4 (server/utils/validators.js) — Task 5 does not
// duplicate or weaken that logic, it just calls it from a JSON endpoint
// instead of a form handler.

const tempStore = require('../services/tempStore');
const { validateExpenseInput } = require('../utils/validators');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

// Route params arrive as strings. A valid id here is a positive integer
// (tempStore assigns ids as 1, 2, 3, ...). Anything else -> null, which
// callers turn into a 400.
function parseId(rawId) {
  if (!/^\d+$/.test(String(rawId))) return null;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serializeExpense(expense) {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt || null
  };
}

// ---- GET /api/expenses ----
// Returns every expense, newest first. Empty data is a normal 200 with
// an empty array, not an error.
function listExpenses(req, res) {
  const expenses = tempStore.getAllExpenses().map(serializeExpense);
  res.status(200).json({
    data: expenses,
    count: expenses.length
  });
}

// ---- GET /api/expenses/:id ----
function getExpense(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid expense id.' });
  }

  const expense = tempStore.getExpenseById(id);
  if (!expense) {
    return res.status(404).json({ error: `No expense found with id ${req.params.id}.` });
  }

  res.status(200).json({ data: serializeExpense(expense) });
}

// ---- POST /api/expenses ----
function createExpense(req, res) {
  const { title, amount, category, date } = req.body || {};
  const input = { title, amount, category, date };

  const { valid, errors } = validateExpenseInput(input);
  if (!valid) {
    return res.status(400).json({ error: 'Validation failed.', errors });
  }

  const created = tempStore.addExpense({
    title: title.trim(),
    amount: Number(amount),
    category,
    date
  });

  res.status(201).json({ data: serializeExpense(created), message: 'Expense created.' });
}

// ---- PUT /api/expenses/:id and PATCH /api/expenses/:id ----
// Same handler for both: existing fields are merged with whatever the
// request sends, the MERGED result is validated with the same rules as
// create, and only then written back. This means PUT (full replace) and
// PATCH (partial update) both end up fully valid, while PATCH callers
// only need to send the fields that changed.
function updateExpense(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid expense id.' });
  }

  const existing = tempStore.getExpenseById(id);
  if (!existing) {
    return res.status(404).json({ error: `No expense found with id ${req.params.id}.` });
  }

  const body = req.body || {};
  const merged = {
    title: body.title !== undefined ? body.title : existing.title,
    amount: body.amount !== undefined ? body.amount : existing.amount,
    category: body.category !== undefined ? body.category : existing.category,
    date: body.date !== undefined ? body.date : existing.date
  };

  const { valid, errors } = validateExpenseInput(merged);
  if (!valid) {
    return res.status(400).json({ error: 'Validation failed.', errors });
  }

  const updated = tempStore.updateExpense(id, {
    title: merged.title.trim(),
    amount: Number(merged.amount),
    category: merged.category,
    date: merged.date
  });

  res.status(200).json({ data: serializeExpense(updated), message: 'Expense updated.' });
}

// ---- DELETE /api/expenses/:id ----
function deleteExpense(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid expense id.' });
  }

  const removed = tempStore.deleteExpense(id);
  if (!removed) {
    return res.status(404).json({ error: `No expense found with id ${req.params.id}.` });
  }

  res.status(200).json({ data: serializeExpense(removed), message: 'Expense deleted.' });
}

// ---- GET /api/expenses/meta/categories ----
// Small convenience endpoint so the Task 5 front end can populate its
// category <select> from the server's real list instead of duplicating
// it as a hardcoded array in client-side JS.
function listCategories(req, res) {
  res.status(200).json({ data: EXPENSE_CATEGORIES });
}

module.exports = {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  listCategories
};
