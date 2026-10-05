const express = require('express');
const router = express.Router();
const task4Controller = require('../controllers/task4.controller');

router.get('/', task4Controller.showLandingPage);

router.get('/login', task4Controller.showLoginForm);
router.post('/login', task4Controller.submitLogin);

router.get('/signup', task4Controller.showSignupForm);
router.post('/signup', task4Controller.submitSignup);

router.get('/dashboard', task4Controller.showDashboard);

router.get('/expenses', task4Controller.showExpensesPage);
router.post('/expenses', task4Controller.submitExpense);

module.exports = router;
