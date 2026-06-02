const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', recurringController.getRecurringTemplates);
router.post('/', recurringController.createRecurringTemplate);
router.delete('/:id', recurringController.deleteRecurringTemplate);
router.patch('/:id/toggle', recurringController.toggleRecurringTemplate);

module.exports = router;
