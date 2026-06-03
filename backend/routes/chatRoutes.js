const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/message', chatController.processChatMessage);

module.exports = router;
