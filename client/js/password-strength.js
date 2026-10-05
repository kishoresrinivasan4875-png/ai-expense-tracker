// Task 4 — client-side password strength checker.
// Mirrors server/utils/validators.js checkPasswordStrength() exactly, so
// the meter the user sees while typing matches what the server will
// ultimately enforce (the server remains the source of truth; this is
// purely a real-time UX layer).
(function (global) {
  'use strict';

  var RULES = {
    minLength: function (value) { return typeof value === 'string' && value.length >= 8; },
    hasUppercase: function (value) { return /[A-Z]/.test(value || ''); },
    hasLowercase: function (value) { return /[a-z]/.test(value || ''); },
    hasNumber: function (value) { return /\d/.test(value || ''); },
    hasSpecialChar: function (value) { return /[^A-Za-z0-9]/.test(value || ''); }
  };

  var LABELS = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];

  function checkPasswordStrength(value) {
    var password = typeof value === 'string' ? value : '';

    var checks = {
      minLength: RULES.minLength(password),
      hasUppercase: RULES.hasUppercase(password),
      hasLowercase: RULES.hasLowercase(password),
      hasNumber: RULES.hasNumber(password),
      hasSpecialChar: RULES.hasSpecialChar(password)
    };

    var passedCount = Object.keys(checks).filter(function (key) { return checks[key]; }).length;

    var score = 0;
    if (password.length === 0) {
      score = 0;
    } else if (passedCount <= 2) {
      score = 1;
    } else if (passedCount === 3) {
      score = 2;
    } else if (passedCount === 4) {
      score = 3;
    } else {
      score = 4;
    }

    return {
      checks: checks,
      score: score,
      label: LABELS[score],
      isStrong: passedCount === 5
    };
  }

  global.PasswordStrength = {
    check: checkPasswordStrength
  };
})(window);
