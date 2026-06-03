const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Require JWT for all account routes

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);
router.post('/:id/share', accountController.shareAccount);

module.exports = router;
