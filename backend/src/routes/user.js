const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken, checkRole(['normal']));

router.get('/stores', userController.getStoresForUser);
router.post('/ratings', userController.submitRating);
router.put('/ratings/:id', userController.modifyRating);

module.exports = router;
