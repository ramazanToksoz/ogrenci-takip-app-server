const express = require('express');
const { addCategory, getCategories } = require('../controllers/categoryController');
const router = express.Router();

router.post('/', addCategory);

router.get("/", getCategories);

module.exports = router;