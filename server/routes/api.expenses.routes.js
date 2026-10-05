const express = require('express');
const router = express.Router();
const apiExpensesController = require('../controllers/api.expenses.controller');

// Mounted at /api/expenses in server/app.js.
//
//   GET    /api/expenses                -> list all expenses
//   GET    /api/expenses/meta/categories -> list valid categories
//   GET    /api/expenses/:id            -> get one expense
//   POST   /api/expenses                -> create an expense
//   PUT    /api/expenses/:id            -> replace an expense
//   PATCH  /api/expenses/:id            -> partially update an expense
//   DELETE /api/expenses/:id            -> delete an expense

router.get('/meta/categories', apiExpensesController.listCategories);

router.get('/', apiExpensesController.listExpenses);
router.post('/', apiExpensesController.createExpense);

router.get('/:id', apiExpensesController.getExpense);
router.put('/:id', apiExpensesController.updateExpense);
router.patch('/:id', apiExpensesController.updateExpense);
router.delete('/:id', apiExpensesController.deleteExpense);

module.exports = router;
