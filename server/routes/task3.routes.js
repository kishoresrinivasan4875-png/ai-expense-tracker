const express = require('express');
const router = express.Router();
const task3Controller = require('../controllers/task3.controller');

router.get('/', task3Controller.showLandingPage);

router.get('/login', task3Controller.showLoginForm);
router.post('/login', task3Controller.submitLogin);

router.get('/signup', task3Controller.showSignupForm);
router.post('/signup', task3Controller.submitSignup);

router.get('/dashboard', task3Controller.showDashboard);

router.get('/expenses', task3Controller.showExpensesPage);
router.post('/expenses', task3Controller.submitExpense);

module.exports = router;
