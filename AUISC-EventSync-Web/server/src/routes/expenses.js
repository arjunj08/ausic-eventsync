const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense
} = require('../controllers/expenseController');

router.get('/', getAllExpenses);
router.get('/:id', getExpenseById);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);
router.patch('/:id/approve', protect, isAdmin, approveExpense);
router.patch('/:id/reject', protect, isAdmin, rejectExpense);

module.exports = router;
