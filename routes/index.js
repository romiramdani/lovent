const express = require('express');
const router = express.Router();
const loginRoutes = require('./loginRoutes.js');
const logoutRoutes = require('./logoutRoutes.js');
const adminUserRoutes = require('./admin/userRoutes.js');
const adminItemRoutes = require('./admin/itemRoutes.js');

const adminHomeController = require('../controllers/admin/homeController.js');

const homeController = require('../controllers/client/homeController.js');




router.use('/login', loginRoutes);
router.use('/logout', logoutRoutes)

router.use('/admin/items', adminItemRoutes);
router.use('/admin/users', adminUserRoutes);
router.get('/admin/home', adminHomeController.getHomePage);

router.use('/home', homeController.getHomePage);

router.use((req, res) => {
    res.redirect('/login')
})

module.exports = router;