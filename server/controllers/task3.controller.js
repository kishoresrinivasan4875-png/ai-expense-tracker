// Task 3 controller
// Purpose: professional, responsive, Bootstrap-based UI (landing page, login,
// signup, dashboard, expenses). This file intentionally introduces NO new
// validation or storage logic — it reuses the exact rules and temporary
// storage already proven in Task 2 (server/utils/validators.js and
// server/services/tempStore.js). Only presentation is new here.

const tempStore = require('../services/tempStore');
const {
  validateExpenseInput,
  validateSignupInput,
  isNonEmptyString,
  isValidEmail
} = require('../utils/validators');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

const EMPTY_EXPENSE_FORM = { title: '', amount: '', category: '', date: '' };
const EMPTY_SIGNUP_FORM = { username: '', email: '' };
const EMPTY_LOGIN_FORM = { email: '' };

function showLandingPage(req, res) {
  res.render('landing/index', {
    pageTitle: 'AI Expense Tracker',
    activePage: 'landing'
  });
}

// ---- Login: UI + light validation demo. Real credential verification and
// session-based authentication are implemented in Task 6. ----

function showLoginForm(req, res) {
  res.render('auth/task3-login-form', {
    pageTitle: 'Log In',
    activePage: 'login',
    errors: {},
    formData: EMPTY_LOGIN_FORM
  });
}

function submitLogin(req, res) {
  const { email, password } = req.body;
  const formData = { email };
  const errors = {};

  if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!isNonEmptyString(password)) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render('auth/task3-login-form', {
      pageTitle: 'Log In',
      activePage: 'login',
      errors,
      formData
    });
  }

  // NOTE: this intentionally does not check credentials against real
  // accounts. Real session-based authentication is implemented in Task 6.
  res.render('auth/task3-login-result', {
    pageTitle: 'Credentials Received',
    activePage: 'login',
    email: email.trim().toLowerCase()
  });
}

// ---- Signup: Bootstrap presentation of the same rules used in Task 2 ----

function showSignupForm(req, res) {
  res.render('auth/task3-signup-form', {
    pageTitle: 'Sign Up',
    activePage: 'signup',
    errors: {},
    formData: EMPTY_SIGNUP_FORM
  });
}

function submitSignup(req, res) {
  const { username, email, password, confirmPassword } = req.body;
  const formData = { username, email };

  const { valid, errors } = validateSignupInput({ username, email, password, confirmPassword });

  if (!valid) {
    return res.status(400).render('auth/task3-signup-form', {
      pageTitle: 'Sign Up',
      activePage: 'signup',
      errors,
      formData
    });
  }

  if (tempStore.findUserByEmail(email)) {
    return res.status(400).render('auth/task3-signup-form', {
      pageTitle: 'Sign Up',
      activePage: 'signup',
      errors: { email: 'An account with this email already exists.' },
      formData
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  // Password is intentionally NOT stored here — same as the Task 2 signup
  // demo. Hashing + persistent accounts arrive in Task 6.
  tempStore.addUser({
    username: trimmedUsername,
    email: normalizedEmail
  });

  res.render('auth/task3-signup-result', {
    pageTitle: 'Account Validated',
    activePage: 'signup',
    username: trimmedUsername,
    email: normalizedEmail
  });
}

// ---- Dashboard: reads real (if temporary) data — never hardcoded ----

function showDashboard(req, res) {
  const expenses = tempStore.getAllExpenses();

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const now = new Date();
  const currentMonthTotal = expenses
    .filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        expDate.getFullYear() === now.getFullYear() &&
        expDate.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    categoryTotals[cat] = 0;
  });
  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const categoryValues = Object.values(categoryTotals);
  const maxCategoryTotal = categoryValues.length > 0 ? Math.max(...categoryValues) : 0;
  const categoriesUsedCount = categoryValues.filter((value) => value > 0).length;

  const recentExpenses = expenses.slice(0, 5);

  res.render('dashboard/index', {
    pageTitle: 'Dashboard',
    activePage: 'dashboard',
    totalCount: expenses.length,
    total,
    currentMonthTotal,
    categoryTotals,
    maxCategoryTotal,
    categoriesUsedCount,
    recentExpenses
  });
}

// ---- Expenses page: Bootstrap UI over the same Task 2 storage/rules ----

function showExpensesPage(req, res) {
  res.render('expenses/task3-index', {
    pageTitle: 'Expenses',
    activePage: 'expenses',
    categories: EXPENSE_CATEGORIES,
    expenses: tempStore.getAllExpenses(),
    errors: {},
    formData: EMPTY_EXPENSE_FORM
  });
}

function submitExpense(req, res) {
  const { title, amount, category, date } = req.body;
  const formData = { title, amount, category, date };

  const { valid, errors } = validateExpenseInput(formData);

  if (!valid) {
    return res.status(400).render('expenses/task3-index', {
      pageTitle: 'Expenses',
      activePage: 'expenses',
      categories: EXPENSE_CATEGORIES,
      expenses: tempStore.getAllExpenses(),
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

  res.redirect('/task3/expenses');
}

module.exports = {
  showLandingPage,
  showLoginForm,
  submitLogin,
  showSignupForm,
  submitSignup,
  showDashboard,
  showExpensesPage,
  submitExpense
};
