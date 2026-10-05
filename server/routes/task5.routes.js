const express = require('express');
const router = express.Router();
const task5Controller = require('../controllers/task5.controller');

// Both routes render the same live, fetch-driven expenses interface.
// /task5/expenses is kept as an explicit alias so the URL is descriptive
// if someone links to it directly.
router.get('/', task5Controller.showExpensesApp);
router.get('/expenses', task5Controller.showExpensesApp);

module.exports = router;
