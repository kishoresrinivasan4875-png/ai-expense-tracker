// Task 4 — client-side app: routing, dynamic DOM updates, and complex
// form validation wiring. Vanilla JS only, progressive enhancement over
// the server-rendered pages (everything still works with JS disabled,
// since every link is a real <a href> and every form is a real <form
// action method>).
(function () {
  'use strict';

  var APP_CONTENT_SELECTOR = '#app-content';
  var NAV_LINK_SELECTOR = 'a[data-router-link]';

  // ============================================================
  // Requirement 3: Client-side routing
  // ============================================================

  function getAppContent() {
    return document.querySelector(APP_CONTENT_SELECTOR);
  }

  function setActiveNavLink(activePage) {
    var links = document.querySelectorAll('#task4NavLinks [data-nav-page]');
    links.forEach(function (link) {
      if (link.getAttribute('data-nav-page') === activePage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function swapContent(html, title, activePage) {
    var container = getAppContent();
    if (!container) return;

    container.classList.add('is-transitioning');

    // Small timeout lets the CSS fade-out transition play before the
    // DOM is replaced, then fades the new content in.
    window.setTimeout(function () {
      container.innerHTML = html;
      container.setAttribute('data-active-page', activePage);
      if (title) document.title = title;
      setActiveNavLink(activePage);
      container.classList.remove('is-transitioning');
      initPage(container);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function loadRoute(url, pushState) {
    fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { data: data, ok: response.ok };
        });
      })
      .then(function (result) {
        swapContent(result.data.html, result.data.title, result.data.activePage);
        if (pushState) {
          window.history.pushState({ url: url }, '', url);
        }
      })
      .catch(function () {
        // Network / parsing failure — fall back to a normal full navigation
        // so the user is never stuck.
        window.location.href = url;
      });
  }

  function isInternalRouterLink(link) {
    if (!link) return false;
    if (link.hasAttribute('data-no-router')) return false;
    if (link.target && link.target === '_blank') return false;
    var href = link.getAttribute('href') || '';
    return href.indexOf('/task4') === 0;
  }

  function attachRouterLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest(NAV_LINK_SELECTOR) : null;
      if (!link || !isInternalRouterLink(link)) return;

      // Respect modifier keys / middle-click so users can still open in a
      // new tab, etc.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) {
        return;
      }

      event.preventDefault();
      var href = link.getAttribute('href');
      if (href === window.location.pathname) return;
      loadRoute(href, true);
    });

    window.addEventListener('popstate', function () {
      loadRoute(window.location.pathname, false);
    });
  }

  // ============================================================
  // AJAX form submission (works together with the router so that
  // submitting a form never causes a full page reload either).
  // ============================================================

  function attachAjaxForms(scope) {
    var forms = scope.querySelectorAll('form.app-ajax-form');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        var body = new URLSearchParams(new FormData(form));

        fetch(form.getAttribute('action'), {
          method: form.getAttribute('method') || 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          body: body.toString()
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            var container = getAppContent();
            if (!container) return;
            container.innerHTML = data.html;
            if (data.title) document.title = data.title;
            if (data.activePage) {
              container.setAttribute('data-active-page', data.activePage);
              setActiveNavLink(data.activePage);
            }
            initPage(container);

            var alertBox = container.querySelector('.alert-success');
            if (data.ok && alertBox && alertBox.textContent.trim().length > 0) {
              alertBox.classList.remove('d-none');
            }
          })
          .catch(function () {
            // Network failure — fall back to a real form submission.
            form.submit();
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    });
  }

  // ============================================================
  // Requirement 1: Complex validation — password strength meter
  // ============================================================

  function attachPasswordStrengthMeter(scope) {
    var passwordInput = scope.querySelector('#password');
    var meter = scope.querySelector('#passwordStrengthMeter');
    if (!passwordInput || !meter || !window.PasswordStrength) return;

    var fill = scope.querySelector('#strengthBarFill');
    var label = scope.querySelector('#strengthLabel');
    var ruleItems = scope.querySelectorAll('#strengthRules [data-rule]');

    var STRENGTH_CLASSES = ['strength-empty', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];

    function render() {
      var result = window.PasswordStrength.check(passwordInput.value);

      STRENGTH_CLASSES.forEach(function (cls) { meter.classList.remove(cls); });
      meter.classList.add(STRENGTH_CLASSES[result.score]);

      if (fill) {
        fill.style.width = (result.score / 4 * 100) + '%';
      }
      if (label) {
        label.textContent = passwordInput.value.length === 0 ? 'Password strength' : 'Strength: ' + result.label;
      }

      ruleItems.forEach(function (item) {
        var rule = item.getAttribute('data-rule');
        var passed = !!result.checks[rule];
        item.classList.toggle('rule-passed', passed);
        var icon = item.querySelector('i');
        if (icon) {
          icon.className = passed ? 'bi bi-check-circle-fill' : 'bi bi-circle';
        }
      });
    }

    passwordInput.addEventListener('input', render);
    render();

    // Confirm-password live match feedback.
    var confirmInput = scope.querySelector('#confirmPassword');
    var confirmError = scope.querySelector('#confirmPasswordError');
    if (confirmInput && confirmError) {
      function checkMatch() {
        if (confirmInput.value.length === 0) {
          confirmInput.classList.remove('is-invalid');
          confirmError.textContent = '';
          return;
        }
        var matches = confirmInput.value === passwordInput.value;
        confirmInput.classList.toggle('is-invalid', !matches);
        confirmError.textContent = matches ? '' : 'Passwords do not match.';
      }
      confirmInput.addEventListener('input', checkMatch);
      passwordInput.addEventListener('input', checkMatch);
    }

    // Show/hide password toggle.
    var toggleBtn = scope.querySelector('#togglePassword');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var showing = passwordInput.type === 'text';
        passwordInput.type = showing ? 'password' : 'text';
        toggleBtn.querySelector('i').className = showing ? 'bi bi-eye' : 'bi bi-eye-slash';
        toggleBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      });
    }
  }

  // Lightweight real-time hints for username/email on the signup form —
  // authoritative validation still happens server-side on submit.
  function attachRealtimeFieldHints(scope) {
    var emailInput = scope.querySelector('#signupForm #email');
    var emailError = scope.querySelector('#signupForm #emailError');
    if (emailInput && emailError) {
      emailInput.addEventListener('blur', function () {
        var value = emailInput.value.trim();
        if (value.length === 0) return;
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var valid = emailRegex.test(value);
        emailInput.classList.toggle('is-invalid', !valid);
        emailError.textContent = valid ? '' : 'Please enter a valid email address.';
      });
    }

    var usernameInput = scope.querySelector('#signupForm #username');
    var usernameError = scope.querySelector('#signupForm #usernameError');
    if (usernameInput && usernameError) {
      usernameInput.addEventListener('blur', function () {
        var value = usernameInput.value.trim();
        if (value.length === 0) return;
        var valid = value.length >= 3;
        usernameInput.classList.toggle('is-invalid', !valid);
        usernameError.textContent = valid ? '' : 'Username must be at least 3 characters.';
      });
    }
  }

  // ============================================================
  // Requirement 2: Dynamic DOM manipulation — expense filtering,
  // live filtered total, and a running-total preview while adding.
  // ============================================================

  function formatCurrencyINR(amount) {
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  }

  function attachExpenseFilter(scope) {
    var filterInput = scope.querySelector('#filterInput');
    var filterCategory = scope.querySelector('#filterCategory');
    var table = scope.querySelector('#expensesTable');
    if (!table) return;

    var noResults = scope.querySelector('#noResults');
    var filteredCount = scope.querySelector('#filteredCount');
    var filteredCountPlural = scope.querySelector('#filteredCountPlural');
    var filteredTotal = scope.querySelector('#filteredTotal');

    function applyFilters() {
      var query = filterInput ? filterInput.value.trim().toLowerCase() : '';
      var category = filterCategory ? filterCategory.value : '';
      var rows = table.querySelectorAll('tbody tr');
      var visibleCount = 0;
      var total = 0;

      rows.forEach(function (row) {
        var matchesText =
          query.length === 0 ||
          row.dataset.title.indexOf(query) !== -1 ||
          row.dataset.category.indexOf(query) !== -1;
        var matchesCategory = category.length === 0 || row.dataset.category === category;
        var visible = matchesText && matchesCategory;

        row.classList.toggle('d-none', !visible);
        if (visible) {
          visibleCount++;
          total += Number(row.dataset.amount) || 0;
        }
      });

      if (filteredCount) filteredCount.textContent = String(visibleCount);
      if (filteredCountPlural) filteredCountPlural.textContent = visibleCount === 1 ? '' : 's';
      if (filteredTotal) filteredTotal.textContent = formatCurrencyINR(total);
      if (noResults) noResults.classList.toggle('d-none', visibleCount !== 0);
    }

    if (filterInput) filterInput.addEventListener('input', applyFilters);
    if (filterCategory) filterCategory.addEventListener('change', applyFilters);
  }

  function attachRunningTotalPreview(scope) {
    var amountInput = scope.querySelector('#expenseForm #amount');
    var preview = scope.querySelector('#runningTotalPreview');
    var table = scope.querySelector('#expensesTable');
    if (!amountInput || !preview) return;

    function currentTotal() {
      if (!table) return 0;
      var rows = table.querySelectorAll('tbody tr');
      var total = 0;
      rows.forEach(function (row) {
        total += Number(row.dataset.amount) || 0;
      });
      return total;
    }

    function render() {
      var value = Number(amountInput.value);
      if (!amountInput.value || Number.isNaN(value) || value <= 0) {
        preview.textContent = '';
        return;
      }
      var newTotal = currentTotal() + value;
      preview.textContent = 'New total after this expense: ' + formatCurrencyINR(newTotal);
    }

    amountInput.addEventListener('input', render);
  }

  // ============================================================
  // Page init — runs on first load AND after every router / AJAX
  // content swap, since the DOM inside #app-content is replaced
  // each time.
  // ============================================================

  function initPage(scope) {
    scope = scope || document;
    attachAjaxForms(scope);
    attachPasswordStrengthMeter(scope);
    attachRealtimeFieldHints(scope);
    attachExpenseFilter(scope);
    attachRunningTotalPreview(scope);
  }

  document.addEventListener('DOMContentLoaded', function () {
    attachRouterLinks();
    var activePage = getAppContent() ? getAppContent().getAttribute('data-active-page') : null;
    setActiveNavLink(activePage);
    initPage(document);

    if (!window.history.state) {
      window.history.replaceState({ url: window.location.pathname }, '', window.location.pathname);
    }
  });
})();
