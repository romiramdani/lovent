const express = require('express');
const router = express.Router();
const itemControllers = require('../../controllers/admin/itemController');

router.delete('/list/delete/:id', itemControllers.deleteItem);
router.put('/list/update/:id', itemControllers.updateItem);
router.get('/list/update/:id', itemControllers.getUpdateItem);
router.post('/add', itemControllers.addItem);
router.get('/add', itemControllers.getInsertPage);
router.get('/list/:id', itemControllers.getItemDetail);
router.get('/list', itemControllers.getAllItems);

module.exports = router;