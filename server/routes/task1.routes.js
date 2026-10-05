const express = require('express');
const router = express.Router();
const task1Controller = require('../controllers/task1.controller');

// GET /  -> show the demo form
router.get('/', task1Controller.showQuickAddForm);

// POST /quick-add -> receive form submission, render result via EJS
router.post('/quick-add', task1Controller.handleQuickAddSubmit);

module.exports = router;
