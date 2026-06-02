const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Require JWT for all category routes

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
