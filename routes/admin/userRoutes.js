const express = require('express');
const router = express.Router();
const adminUserControllers = require('../../controllers/admin/userController.js');

router.delete('/delete/:id', adminUserControllers.deleteUser);
router.put('/update/:id', adminUserControllers.updateUser);
router.get('/update/:id', adminUserControllers.getUpdatePage);
router.post('/add', adminUserControllers.addUser);
router.get('/add', adminUserControllers.getInsertPage);
router.get('/list', adminUserControllers.getAllusers);

module.exports = router;