const express = require('express');
const router = express.Router();
const publicEcomController = require('../controllers/publicEcomController');

// This route is public and does not require authMiddleware
router.get('/:nit', publicEcomController.getCatalog);

module.exports = router;
