const express = require('express');
const router = express.Router();

const adminHistoryControllers = require('../../controllers/admin/historyController');

router.get('/borrow/download', adminHistoryControllers.downloadBorrowHistoryCSV);
router.get('/store/download', adminHistoryControllers.downloadStoreHistoryCSV);
router.get('/borrow', adminHistoryControllers.getBorrowHistory);
router.get('/store', adminHistoryControllers.getStoreHistory);

module.exports = router;