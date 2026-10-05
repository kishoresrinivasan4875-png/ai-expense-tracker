const express = require('express');
const router = express.Router();
const task2Controller = require('../controllers/task2.controller');

// Expense add + temporary storage
router.get('/expenses/new', task2Controller.showAddExpenseForm);
router.post('/expenses', task2Controller.submitExpense);
router.get('/expenses', task2Controller.listExpenses);

// Signup validation demo (real accounts arrive in Task 6)
router.get('/signup', task2Controller.showSignupForm);
router.post('/signup', task2Controller.submitSignup);

module.exports = router;
