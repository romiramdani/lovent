const express = require('express');
const router = express.Router();
const adminItemControllers = require('../../controllers/admin/itemController');

router.post('/takeover/confirm', adminItemControllers.confirmTakeoverRequest);
router.post('/takeover/reject', adminItemControllers.rejectTakeoverRequest);
router.get('/takeover', adminItemControllers.getTakeoverRequests);
router.post('/store/reject', adminItemControllers.rejectStoreRequest);
router.post('/store/:id', adminItemControllers.confirmStoreRequest);
router.get('/store/:id', adminItemControllers.getFormStoreRequest)
router.get('/store', adminItemControllers.getStoreRequests);
router.post('/return/confirm', adminItemControllers.confirmReturnRequest);
router.post('/return/reject', adminItemControllers.rejectReturnRequest);
router.get('/return', adminItemControllers.getReturnRequests);
router.post('/borrow/confirm', adminItemControllers.confirmBorrowRequest);
router.post('/borrow/reject', adminItemControllers.rejectBorrowRequest);
router.get('/borrow', adminItemControllers.getBorrowRequests);
router.get('/list/download', adminItemControllers.downloadItemsCSV);
router.delete('/list/delete/:id', adminItemControllers.deleteItem);
router.put('/list/update/:id', adminItemControllers.updateItem);
router.get('/list/update/:id', adminItemControllers.getUpdateItem);
router.post('/add', adminItemControllers.addItem);
router.get('/list/add', adminItemControllers.getInsertPage);
router.get('/list/:id', adminItemControllers.getItemDetail);
router.get('/list', adminItemControllers.getAllItems);

module.exports = router;