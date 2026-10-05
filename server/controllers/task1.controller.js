// Task 1 controller
// Purpose: demonstrate the core Express + EJS request/response flow.
// No validation and no storage yet on purpose — those are introduced in
// Task 2 (validation + temporary storage) and Task 6 (MongoDB).

const { EXPENSE_CATEGORIES } = require('../utils/constants');

function showQuickAddForm(req, res) {
  res.render('expenses/task1-form', {
    pageTitle: 'Quick Add Expense (Task 1 Demo)',
    categories: EXPENSE_CATEGORIES
  });
}

function handleQuickAddSubmit(req, res) {
  const { title, amount, category, date } = req.body;

  // Server receives whatever the browser sent. We echo it back through
  // EJS so we can prove the full request/response cycle is working.
  const submittedExpense = {
    title: title || '(not provided)',
    amount: amount || '(not provided)',
    category: category || '(not provided)',
    date: date || '(not provided)',
    receivedAt: new Date().toLocaleString()
  };

  res.render('expenses/task1-result', {
    pageTitle: 'Submission Received',
    submittedExpense
  });
}

module.exports = {
  showQuickAddForm,
  handleQuickAddSubmit
};
