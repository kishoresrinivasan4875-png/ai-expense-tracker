// Server-side validation.
// CRITICAL: this is the source of truth for what data is acceptable.
// The browser's inline JS validation (in the EJS forms) is only a UX
// convenience — it can always be bypassed (disabled JS, curl, Postman,
// a modified fetch call), so every rule here is re-checked independently.

const { EXPENSE_CATEGORIES } = require('./constants');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  if (!isNonEmptyString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

function isPositiveNumber(value) {
  if (value === undefined || value === null || value === '') return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && num > 0;
}

function isValidCategory(value) {
  return EXPENSE_CATEGORIES.includes(value);
}

function isValidDate(value) {
  if (!isNonEmptyString(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isValidPassword(value) {
  // At least 8 characters, with at least one letter and one number.
  if (typeof value !== 'string') return false;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return passwordRegex.test(value);
}

function validateExpenseInput(data) {
  const errors = {};

  if (!isNonEmptyString(data.title)) {
    errors.title = 'Title is required.';
  }
  if (!isPositiveNumber(data.amount)) {
    errors.amount = 'Amount must be a positive number.';
  }
  if (!isValidCategory(data.category)) {
    errors.category = 'Please select a valid category.';
  }
  if (!isValidDate(data.date)) {
    errors.date = 'Please provide a valid date.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateSignupInput(data) {
  const errors = {};

  if (!isNonEmptyString(data.username)) {
    errors.username = 'Username is required.';
  }
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 8 characters and include a letter and a number.';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ============================================================
// Task 4 additions — Complex Form Validation
// ------------------------------------------------------------
// These functions are ADDITIVE. They do not alter isValidPassword
// or validateSignupInput above, so Task 2 and Task 3 signup routes
// keep behaving exactly as before. Task 4's signup route uses the
// stricter rules below instead.
// ============================================================

// Individual password strength rules, exposed separately so the
// client-side strength meter can mirror the exact same checks the
// server enforces (same source of truth, just also run in-browser
// for instant feedback).
const PASSWORD_RULES = {
  minLength: (value) => typeof value === 'string' && value.length >= 8,
  hasUppercase: (value) => /[A-Z]/.test(value || ''),
  hasLowercase: (value) => /[a-z]/.test(value || ''),
  hasNumber: (value) => /\d/.test(value || ''),
  hasSpecialChar: (value) => /[^A-Za-z0-9]/.test(value || '')
};

// Returns a detailed breakdown used both for the real-time UI meter
// and for the stricter server-side check below.
function checkPasswordStrength(value) {
  const password = typeof value === 'string' ? value : '';

  const checks = {
    minLength: PASSWORD_RULES.minLength(password),
    hasUppercase: PASSWORD_RULES.hasUppercase(password),
    hasLowercase: PASSWORD_RULES.hasLowercase(password),
    hasNumber: PASSWORD_RULES.hasNumber(password),
    hasSpecialChar: PASSWORD_RULES.hasSpecialChar(password)
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  // score: 0 (empty) .. 4 (very strong)
  let score = 0;
  if (password.length === 0) {
    score = 0;
  } else if (passedCount <= 2) {
    score = 1; // weak
  } else if (passedCount === 3) {
    score = 2; // fair
  } else if (passedCount === 4) {
    score = 3; // good
  } else {
    score = 4; // strong (all 5 rules met)
  }

  const labels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];

  return {
    checks,
    score,
    label: labels[score],
    // "strong enough to accept" — all five rules must pass
    isStrong: passedCount === 5
  };
}

function isStrongPassword(value) {
  return checkPasswordStrength(value).isStrong;
}

// Stricter signup validation used ONLY by Task 4. Username/email
// rules are reused as-is from the existing logic above; only the
// password rule is upgraded to the full strength check.
function validateSignupInputStrict(data) {
  const errors = {};

  if (!isNonEmptyString(data.username)) {
    errors.username = 'Username is required.';
  } else if (data.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!isStrongPassword(data.password)) {
    errors.password =
      'Password must be at least 8 characters and include an uppercase letter, ' +
      'a lowercase letter, a number, and a special character.';
  }

  if (!isNonEmptyString(data.confirmPassword) || data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isPositiveNumber,
  isValidCategory,
  isValidDate,
  isValidPassword,
  validateExpenseInput,
  validateSignupInput,
  PASSWORD_RULES,
  checkPasswordStrength,
  isStrongPassword,
  validateSignupInputStrict
};
