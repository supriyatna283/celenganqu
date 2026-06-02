const express = require('express');
const router = express.Router();
const debtLoanController = require('../controllers/debtLoanController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', debtLoanController.getDebtsLoans);
router.post('/', debtLoanController.createDebtLoan);
router.delete('/:id', debtLoanController.deleteDebtLoan);
router.post('/:id/pay', debtLoanController.payDebtLoan);

module.exports = router;
