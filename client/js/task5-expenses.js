// Task 5 — API Integration and Front-End Interaction
//
// Vanilla JS, no local array standing in for the server. Every action the
// user takes (load / add / edit / delete) goes through fetch() to the
// real REST API at /api/expenses, and the DOM is rebuilt from whatever
// JSON the server actually returns.
//
//   Browser -> fetch() -> Express REST API -> tempStore -> JSON -> DOM
//
(function () {
  'use strict';

  var API_BASE = '/api/expenses';

  var els = {}; // populated once the DOM is ready

  function cacheEls() {
    els.form = document.getElementById('expenseForm');
    els.editingId = document.getElementById('editingId');
    els.title = document.getElementById('title');
    els.amount = document.getElementById('amount');
    els.category = document.getElementById('category');
    els.date = document.getElementById('date');

    els.titleError = document.getElementById('titleError');
    els.amountError = document.getElementById('amountError');
    els.categoryError = document.getElementById('categoryError');
    els.dateError = document.getElementById('dateError');

    els.formTitle = document.getElementById('formTitle');
    els.submitBtn = document.getElementById('submitBtn');
    els.submitBtnLabel = document.getElementById('submitBtnLabel');
    els.submitSpinner = document.getElementById('submitSpinner');
    els.cancelEditBtn = document.getElementById('cancelEditBtn');
    els.formSuccessAlert = document.getElementById('formSuccessAlert');

    els.apiErrorAlert = document.getElementById('apiErrorAlert');
    els.refreshBtn = document.getElementById('refreshBtn');

    els.loadingState = document.getElementById('loadingState');
    els.emptyState = document.getElementById('emptyState');
    els.tableWrapper = document.getElementById('tableWrapper');
    els.tableBody = document.getElementById('expensesTableBody');

    els.expenseCount = document.getElementById('expenseCount');
    els.expenseCountPlural = document.getElementById('expenseCountPlural');
    els.expenseTotal = document.getElementById('expenseTotal');
  }

  function formatCurrencyINR(amount) {
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  }

  function formatDateDisplay(isoLike) {
    var d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return isoLike;
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  // ---------------------------------------------------------------
  // Error banner (network failures, unexpected server errors)
  // ---------------------------------------------------------------

  function showApiError(message) {
    els.apiErrorAlert.textContent = message;
    els.apiErrorAlert.classList.remove('d-none');
  }

  function clearApiError() {
    els.apiErrorAlert.classList.add('d-none');
    els.apiErrorAlert.textContent = '';
  }

  // ---------------------------------------------------------------
  // Field-level validation errors (both client-side pre-checks and
  // server-side 400 responses render into the same spots)
  // ---------------------------------------------------------------

  var FIELD_ERROR_ELS = null;
  function fieldErrorEls() {
    if (!FIELD_ERROR_ELS) {
      FIELD_ERROR_ELS = {
        title: els.titleError,
        amount: els.amountError,
        category: els.categoryError,
        date: els.dateError
      };
    }
    return FIELD_ERROR_ELS;
  }

  function clearFieldErrors() {
    [els.title, els.amount, els.category, els.date].forEach(function (input) {
      input.classList.remove('is-invalid');
    });
    var map = fieldErrorEls();
    Object.keys(map).forEach(function (key) {
      map[key].textContent = '';
    });
  }

  function showFieldErrors(errors) {
    var inputs = { title: els.title, amount: els.amount, category: els.category, date: els.date };
    var map = fieldErrorEls();
    Object.keys(errors).forEach(function (key) {
      if (inputs[key]) inputs[key].classList.add('is-invalid');
      if (map[key]) map[key].textContent = errors[key];
    });
  }

  // Mirrors server/utils/validators.js' validateExpenseInput() closely
  // enough to catch obvious mistakes instantly, client-side, before a
  // network round trip. The server re-validates everything regardless —
  // this is a UX convenience only, never the source of truth.
  function validateClientSide(data) {
    var errors = {};
    if (!data.title || !data.title.trim()) {
      errors.title = 'Title is required.';
    }
    var amountNum = Number(data.amount);
    if (data.amount === '' || data.amount === null || Number.isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'Amount must be a positive number.';
    }
    if (!data.category) {
      errors.category = 'Please select a valid category.';
    }
    if (!data.date || Number.isNaN(new Date(data.date).getTime())) {
      errors.date = 'Please provide a valid date.';
    }
    return errors;
  }

  // ---------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------

  function renderExpenses(expenses) {
    els.loadingState.classList.add('d-none');

    if (expenses.length === 0) {
      els.tableWrapper.classList.add('d-none');
      els.emptyState.classList.remove('d-none');
    } else {
      els.emptyState.classList.add('d-none');
      els.tableWrapper.classList.remove('d-none');
    }

    var total = 0;
    var rowsHtml = expenses
      .map(function (exp) {
        total += Number(exp.amount) || 0;
        return (
          '<tr data-id="' + exp.id + '">' +
            '<td>' + escapeHtml(exp.title) + '</td>' +
            '<td><span class="category-pill">' + escapeHtml(exp.category) + '</span></td>' +
            '<td>' + escapeHtml(formatDateDisplay(exp.date)) + '</td>' +
            '<td class="text-end">' + formatCurrencyINR(exp.amount) + '</td>' +
            '<td class="text-end">' +
              '<button type="button" class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="' + exp.id + '">' +
                '<i class="bi bi-pencil"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="' + exp.id + '">' +
                '<i class="bi bi-trash"></i>' +
              '</button>' +
            '</td>' +
          '</tr>'
        );
      })
      .join('');

    els.tableBody.innerHTML = rowsHtml;
    els.expenseCount.textContent = String(expenses.length);
    els.expenseCountPlural.textContent = expenses.length === 1 ? '' : 's';
    els.expenseTotal.textContent = formatCurrencyINR(total);

    // Keep a lookup so Edit doesn't need a second network round trip.
    window.__task5Expenses = expenses;
  }

  // ---------------------------------------------------------------
  // API calls
  // ---------------------------------------------------------------

  function apiRequest(url, options) {
    return fetch(url, options)
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            // Non-JSON body (shouldn't normally happen against this API,
            // but network proxies / 502 pages sometimes return HTML).
            return {};
          })
          .then(function (body) {
            return { response: response, body: body };
          });
      });
  }

  function loadExpenses() {
    els.loadingState.classList.remove('d-none');
    els.emptyState.classList.add('d-none');
    els.tableWrapper.classList.add('d-none');
    clearApiError();

    return apiRequest(API_BASE, {
      headers: { Accept: 'application/json' }
    })
      .then(function (result) {
        if (!result.response.ok) {
          throw new Error((result.body && result.body.error) || 'Failed to load expenses.');
        }
        renderExpenses(result.body.data || []);
      })
      .catch(function (err) {
        els.loadingState.classList.add('d-none');
        showApiError('Could not load expenses: ' + err.message + ' Check your connection and try Refresh.');
      });
  }

  function setSubmitBusy(busy) {
    els.submitBtn.disabled = busy;
    els.submitSpinner.classList.toggle('d-none', !busy);
  }

  function resetFormToAddMode() {
    els.form.reset();
    els.editingId.value = '';
    els.formTitle.textContent = 'Add Expense';
    els.submitBtnLabel.textContent = 'Add Expense';
    els.cancelEditBtn.classList.add('d-none');
    clearFieldErrors();
  }

  function enterEditMode(expense) {
    els.editingId.value = expense.id;
    els.title.value = expense.title;
    els.amount.value = expense.amount;
    els.category.value = expense.category;
    // <input type="date"> needs YYYY-MM-DD.
    var d = new Date(expense.date);
    els.date.value = Number.isNaN(d.getTime()) ? expense.date : d.toISOString().slice(0, 10);

    els.formTitle.textContent = 'Edit Expense';
    els.submitBtnLabel.textContent = 'Save Changes';
    els.cancelEditBtn.classList.remove('d-none');
    clearFieldErrors();
    els.title.focus();
    els.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function flashFormSuccess(message) {
    els.formSuccessAlert.textContent = message;
    els.formSuccessAlert.classList.remove('d-none');
    window.setTimeout(function () {
      els.formSuccessAlert.classList.add('d-none');
    }, 2500);
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearApiError();
    clearFieldErrors();

    var data = {
      title: els.title.value,
      amount: els.amount.value,
      category: els.category.value,
      date: els.date.value
    };

    var clientErrors = validateClientSide(data);
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(clientErrors);
      return;
    }

    var editingId = els.editingId.value;
    var isEdit = !!editingId;
    var url = isEdit ? API_BASE + '/' + editingId : API_BASE;
    var method = isEdit ? 'PUT' : 'POST';

    setSubmitBusy(true);

    apiRequest(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (result) {
        if (!result.response.ok) {
          if (result.response.status === 400 && result.body && result.body.errors) {
            showFieldErrors(result.body.errors);
            return;
          }
          throw new Error((result.body && result.body.error) || 'Request failed.');
        }

        flashFormSuccess(isEdit ? 'Expense updated.' : 'Expense added.');
        resetFormToAddMode();
        return loadExpenses();
      })
      .catch(function (err) {
        showApiError('Could not save this expense: ' + err.message);
      })
      .finally(function () {
        setSubmitBusy(false);
      });
  }

  function handleTableClick(event) {
    var editBtn = event.target.closest('.edit-btn');
    var deleteBtn = event.target.closest('.delete-btn');

    if (editBtn) {
      var id = Number(editBtn.getAttribute('data-id'));
      var expense = (window.__task5Expenses || []).find(function (exp) { return exp.id === id; });
      if (expense) enterEditMode(expense);
      return;
    }

    if (deleteBtn) {
      var deleteId = deleteBtn.getAttribute('data-id');
      var row = deleteBtn.closest('tr');
      var title = row ? row.querySelector('td').textContent : 'this expense';

      if (!window.confirm('Delete "' + title + '"? This cannot be undone.')) {
        return;
      }

      clearApiError();
      deleteBtn.disabled = true;

      apiRequest(API_BASE + '/' + deleteId, { method: 'DELETE', headers: { Accept: 'application/json' } })
        .then(function (result) {
          if (!result.response.ok) {
            throw new Error((result.body && result.body.error) || 'Delete failed.');
          }
          // If we were mid-edit on the row we just deleted, back out of edit mode.
          if (els.editingId.value === String(deleteId)) {
            resetFormToAddMode();
          }
          return loadExpenses();
        })
        .catch(function (err) {
          deleteBtn.disabled = false;
          showApiError('Could not delete this expense: ' + err.message);
        });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    cacheEls();
    if (!els.form) return; // task5 page not on this render

    els.form.addEventListener('submit', handleSubmit);
    els.cancelEditBtn.addEventListener('click', resetFormToAddMode);
    els.refreshBtn.addEventListener('click', loadExpenses);
    els.tableBody.addEventListener('click', handleTableClick);

    loadExpenses();
  });
})();
