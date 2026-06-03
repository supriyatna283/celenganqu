const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(protect); // Require JWT for all transaction routes

router.get('/', transactionController.getTransactions);
router.get('/export', transactionController.exportCSV);
router.post('/import', upload.single('file'), transactionController.importCSV);
router.post('/', upload.single('attachment'), transactionController.createTransaction);
router.put('/:id', upload.single('attachment'), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
