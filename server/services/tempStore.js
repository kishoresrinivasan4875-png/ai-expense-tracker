// Temporary server-side storage for Task 2.
//
// IMPORTANT: This is an in-memory store, NOT a database. All data is lost
// whenever the server restarts. It exists purely to satisfy the Task 2
// requirement of demonstrating temporary server-side storage before real
// persistence is introduced. Task 6 replaces this module's usage with
// MongoDB via Mongoose — the validation logic in utils/validators.js stays
// the same either way.
//
// Task 5 additions (getExpenseById / updateExpense / deleteExpense) are
// ADDITIVE ONLY — addExpense() and getAllExpenses() are untouched, so
// Tasks 1-4 keep behaving exactly as before. The Task 5 REST API operates
// on this exact same array, so expenses created through the Task 1/2/3/4
// forms are visible to the API, and expenses created through the API are
// visible on the Task 2/3/4 pages (one shared in-memory store per server
// process).

const expenses = [];
const users = [];

let nextExpenseId = 1;

function addExpense(data) {
  const expense = {
    id: nextExpenseId++,
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: data.date,
    createdAt: new Date()
  };
  expenses.push(expense);
  return expense;
}

function getAllExpenses() {
  return expenses.slice().sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================================
// Task 5 additions — REST API CRUD support
// ============================================================

function getExpenseById(id) {
  return expenses.find((exp) => exp.id === id) || null;
}

// Merges `data` onto the existing expense and returns the updated record,
// or null if no expense with that id exists. Only the fields present in
// `data` are changed (supports both a full PUT replace and a partial
// PATCH), and createdAt/id are always preserved.
function updateExpense(id, data) {
  const expense = getExpenseById(id);
  if (!expense) return null;

  if (data.title !== undefined) expense.title = data.title;
  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.category !== undefined) expense.category = data.category;
  if (data.date !== undefined) expense.date = data.date;
  expense.updatedAt = new Date();

  return expense;
}

function deleteExpense(id) {
  const index = expenses.findIndex((exp) => exp.id === id);
  if (index === -1) return null;
  const [removed] = expenses.splice(index, 1);
  return removed;
}

function addUser(data) {
  const user = {
    username: data.username,
    email: data.email,
    createdAt: new Date()
  };
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  return users.find((user) => user.email === normalized);
}

module.exports = {
  addExpense,
  getAllExpenses,
  addUser,
  findUserByEmail,
  getExpenseById,
  updateExpense,
  deleteExpense
};
