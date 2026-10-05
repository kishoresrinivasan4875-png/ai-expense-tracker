// Task 5 controller — API Integration and Front-End Interaction
//
// This controller only renders the page shell. It does NOT read expenses
// from tempStore and does NOT pass any expense data into the view — the
// whole point of Task 5 is that the browser fetches that data itself from
// the REST API (GET /api/expenses) after the page loads, via
// client/js/task5-expenses.js. The categories list is real (from
// utils/constants.js) since it's needed to render the <select> immediately
// rather than adding an extra round trip.

const { EXPENSE_CATEGORIES } = require('../utils/constants');

function showExpensesApp(req, res) {
  res.render('task5/shell', {
    pageTitle: 'Task 5 — Live Expenses',
    categories: EXPENSE_CATEGORIES
  });
}

module.exports = {
  showExpensesApp
};
