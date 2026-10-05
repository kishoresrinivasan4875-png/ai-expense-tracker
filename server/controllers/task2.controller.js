// Task 2 controller
// Purpose: demonstrate client-side validation, independent server-side
// validation, and temporary server-side storage — across two forms:
// 1) Add Expense  2) Signup (validation only; real accounts arrive in Task 6)

const tempStore = require('../services/tempStore');
const { validateExpenseInput, validateSignupInput } = require('../utils/validators');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

const EMPTY_EXPENSE_FORM = { title: '', amount: '', category: '', date: '' };
const EMPTY_SIGNUP_FORM = { username: '', email: '' };

function showAddExpenseForm(req, res) {
  res.render('expenses/task2-add-form', {
    pageTitle: 'Add Expense (Task 2 Demo)',
    categories: EXPENSE_CATEGORIES,
    errors: {},
    formData: EMPTY_EXPENSE_FORM
  });
}

function submitExpense(req, res) {
  const { title, amount, category, date } = req.body;
  const formData = { title, amount, category, date };

  const { valid, errors } = validateExpenseInput(formData);

  if (!valid) {
    return res.status(400).render('expenses/task2-add-form', {
      pageTitle: 'Add Expense (Task 2 Demo)',
      categories: EXPENSE_CATEGORIES,
      errors,
      formData
    });
  }

  tempStore.addExpense({
    title: title.trim(),
    amount: Number(amount),
    category,
    date
  });

  res.redirect('/task2/expenses');
}

function listExpenses(req, res) {
  res.render('expenses/task2-list', {
    pageTitle: 'Stored Expenses (Temporary)',
    expenses: tempStore.getAllExpenses()
  });
}

function showSignupForm(req, res) {
  res.render('auth/task2-signup-form', {
    pageTitle: 'Signup Validation Demo (Task 2)',
    errors: {},
    formData: EMPTY_SIGNUP_FORM
  });
}

function submitSignup(req, res) {
  const { username, email, password, confirmPassword } = req.body;
  const formData = { username, email };

  const { valid, errors } = validateSignupInput({ username, email, password, confirmPassword });

  if (!valid) {
    return res.status(400).render('auth/task2-signup-form', {
      pageTitle: 'Signup Validation Demo (Task 2)',
      errors,
      formData
    });
  }

  if (tempStore.findUserByEmail(email)) {
    return res.status(400).render('auth/task2-signup-form', {
      pageTitle: 'Signup Validation Demo (Task 2)',
      errors: { email: 'An account with this email already exists.' },
      formData
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  // Password is intentionally NOT stored here — this step only proves
  // validation works. Hashing + persistent accounts arrive in Task 6.
  tempStore.addUser({
    username: trimmedUsername,
    email: normalizedEmail
  });

  res.render('auth/task2-signup-result', {
    pageTitle: 'Signup Validated',
    username: trimmedUsername,
    email: normalizedEmail
  });
}

module.exports = {
  showAddExpenseForm,
  submitExpense,
  listExpenses,
  showSignupForm,
  submitSignup
};
