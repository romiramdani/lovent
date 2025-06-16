const express = require('express');
const router = express.Router();

const adminHistoryControllers = require('../../controllers/admin/historyController');

router.get('/store/download', adminHistoryControllers.downloadStoreHistoryCSV);
router.get('/store', adminHistoryControllers.getStoreHistory);

module.exports = router;