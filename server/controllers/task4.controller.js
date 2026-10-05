// Task 4 controller — Complex Form Validation and Dynamic DOM Manipulation
//
// This controller reuses the exact same in-memory storage (tempStore) and
// most of the same validation rules already proven in Task 2/Task 3. It
// adds three things, matching the three official Task 4 requirements:
//
//   1. Complex validation  -> stricter password rules for signup
//      (server/utils/validators.js: validateSignupInputStrict), with a
//      real-time client-side strength meter that mirrors the same rules.
//   2. Dynamic DOM updates -> live expense search/category filter with a
//      running filtered total, and a live "running total" preview while
//      adding an expense — both meaningful, expense-tracker-specific
//      interactions handled entirely in the browser (client/js/task4-app.js).
//   3. Client-side routing -> every page below can render either as a full
//      HTML document (direct navigation / no-JS fallback) or as a JSON
//      fragment (AJAX navigation), depending on whether the request carries
//      the X-Requested-With: XMLHttpRequest header. The router in
//      client/js/task4-app.js swaps the fragment into #app-content and
//      uses the History API, so navigating between Task 4 pages does not
//      reload the page, while every URL still works with a direct visit,
//      reload, or browser back/forward button.

const tempStore = require('../services/tempStore');
const {
  validateExpenseInput,
  validateSignupInputStrict,
  isNonEmptyString,
  isValidEmail
} = require('../utils/validators');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

const EMPTY_EXPENSE_FORM = { title: '', amount: '', category: '', date: '' };
const EMPTY_SIGNUP_FORM = { username: '', email: '' };
const EMPTY_LOGIN_FORM = { email: '' };

function isAjaxRequest(req) {
  return req.get('X-Requested-With') === 'XMLHttpRequest';
}

// Renders either a JSON fragment (for the client-side router) or a full
// HTML page (for direct navigation, reloads, and browsers with JS off).
function renderPage(req, res, { contentView, title, activePage, status = 200, locals = {} }) {
  const fullLocals = Object.assign({ pageTitle: title, activePage }, locals);

  if (isAjaxRequest(req)) {
    res.render(`task4/pages/${contentView}`, fullLocals, (err, html) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to render page.' });
      }
      res.status(status).json({
        html,
        title: `${title} | AI Expense Tracker`,
        activePage,
        ok: status < 400
      });
    });
    return;
  }

  res.status(status).render('task4/shell', Object.assign({ contentView }, fullLocals));
}

// ---- Landing ----

function showLandingPage(req, res) {
  renderPage(req, res, {
    contentView: 'landing',
    title: 'AI Expense Tracker',
    activePage: 'landing'
  });
}

// ---- Login: UI + light validation demo. Real credential verification and
// session-based authentication are implemented in Task 6. ----

function showLoginForm(req, res) {
  renderPage(req, res, {
    contentView: 'login-form',
    title: 'Log In',
    activePage: 'login',
    locals: { errors: {}, formData: EMPTY_LOGIN_FORM }
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
    return renderPage(req, res, {
      contentView: 'login-form',
      title: 'Log In',
      activePage: 'login',
      status: 400,
      locals: { errors, formData }
    });
  }

  renderPage(req, res, {
    contentView: 'login-result',
    title: 'Credentials Received',
    activePage: 'login',
    locals: { email: email.trim().toLowerCase() }
  });
}

// ---- Signup: Task 4 adds complex password-strength validation on top of
// the same username/email rules already used in Task 2/Task 3. ----

function showSignupForm(req, res) {
  renderPage(req, res, {
    contentView: 'signup-form',
    title: 'Sign Up',
    activePage: 'signup',
    locals: { errors: {}, formData: EMPTY_SIGNUP_FORM }
  });
}

function submitSignup(req, res) {
  const { username, email, password, confirmPassword } = req.body;
  const formData = { username, email };

  const { valid, errors } = validateSignupInputStrict({ username, email, password, confirmPassword });

  if (!valid) {
    return renderPage(req, res, {
      contentView: 'signup-form',
      title: 'Sign Up',
      activePage: 'signup',
      status: 400,
      locals: { errors, formData }
    });
  }

  if (tempStore.findUserByEmail(email)) {
    return renderPage(req, res, {
      contentView: 'signup-form',
      title: 'Sign Up',
      activePage: 'signup',
      status: 400,
      locals: { errors: { email: 'An account with this email already exists.' }, formData }
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  // Password is intentionally NOT stored here — same as Task 2/Task 3.
  // Hashing + persistent accounts arrive in Task 6.
  tempStore.addUser({
    username: trimmedUsername,
    email: normalizedEmail
  });

  renderPage(req, res, {
    contentView: 'signup-result',
    title: 'Account Validated',
    activePage: 'signup',
    locals: { username: trimmedUsername, email: normalizedEmail }
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

  renderPage(req, res, {
    contentView: 'dashboard',
    title: 'Dashboard',
    activePage: 'dashboard',
    locals: {
      totalCount: expenses.length,
      total,
      currentMonthTotal,
      categoryTotals,
      maxCategoryTotal,
      categoriesUsedCount,
      recentExpenses
    }
  });
}

// ---- Expenses page: same Task 2 storage/validation rules, plus Task 4's
// live filter/search and running-total preview handled client-side. ----

function showExpensesPage(req, res) {
  renderPage(req, res, {
    contentView: 'expenses',
    title: 'Expenses',
    activePage: 'expenses',
    locals: {
      categories: EXPENSE_CATEGORIES,
      expenses: tempStore.getAllExpenses(),
      errors: {},
      formData: EMPTY_EXPENSE_FORM
    }
  });
}

function submitExpense(req, res) {
  const { title, amount, category, date } = req.body;
  const formData = { title, amount, category, date };

  // Reuses the exact same server-side rule set as Task 2 and Task 3 —
  // Task 4 does not weaken or bypass existing expense validation.
  const { valid, errors } = validateExpenseInput(formData);

  if (!valid) {
    return renderPage(req, res, {
      contentView: 'expenses',
      title: 'Expenses',
      activePage: 'expenses',
      status: 400,
      locals: {
        categories: EXPENSE_CATEGORIES,
        expenses: tempStore.getAllExpenses(),
        errors,
        formData
      }
    });
  }

  tempStore.addExpense({
    title: title.trim(),
    amount: Number(amount),
    category,
    date
  });

  // AJAX (client-side router / fetch form submit): re-render the expenses
  // fragment in place — no full page reload needed.
  if (isAjaxRequest(req)) {
    return renderPage(req, res, {
      contentView: 'expenses',
      title: 'Expenses',
      activePage: 'expenses',
      locals: {
        categories: EXPENSE_CATEGORIES,
        expenses: tempStore.getAllExpenses(),
        errors: {},
        formData: EMPTY_EXPENSE_FORM,
        successMessage: 'Expense added successfully.'
      }
    });
  }

  // No-JS fallback: normal redirect-after-POST.
  res.redirect('/task4/expenses');
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
