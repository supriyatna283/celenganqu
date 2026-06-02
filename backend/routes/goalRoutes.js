const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/deposit', goalController.depositToGoal);

module.exports = router;
