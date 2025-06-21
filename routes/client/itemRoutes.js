const express = require('express');
const router = express.Router();
const itemController = require('../../controllers/client/itemController.js');

router.get('/history/store', itemController.getStoreHistory);
router.get('/history/borrow', itemController.getBorrowHistory);
router.post('/store', itemController.storeItem);
router.get('/store', itemController.getStoreItem);
router.post('/borrow', itemController.borrowItem);
router.get('/borrowed', itemController.getBorrowedItems);
router.post('/return', itemController.returnItem);
router.get('/list/:id', itemController.getItemDetail);
router.get('/list', itemController.getItems);

module.exports = router;