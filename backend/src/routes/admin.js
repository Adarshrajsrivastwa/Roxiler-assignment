const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all admin routes
router.use(verifyToken, checkRole(['admin']));

router.get('/stats', adminController.getDashboardStats);
router.post('/users', adminController.addUser);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/unassigned-owners', adminController.getUnassignedOwners);

// Add store (with file upload for logo)
router.post('/stores', upload.single('logo'), adminController.addStore);
router.get('/stores', adminController.getStores);
router.put('/stores/:id', upload.single('logo'), adminController.updateStore);
router.delete('/stores/:id', adminController.deleteStore);

// Ratings endpoints
router.get('/ratings', adminController.getRatings);
router.delete('/ratings/:id', adminController.deleteRating);

module.exports = router;
