const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')

router.get('/', authController.getLoginPage);
router.post('/', authController.login)

module.exports = router;