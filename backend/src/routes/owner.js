const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken, checkRole(['owner']));

router.get('/dashboard', ownerController.getOwnerDashboard);

module.exports = router;
