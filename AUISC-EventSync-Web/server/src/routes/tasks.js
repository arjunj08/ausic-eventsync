const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus
} = require('../controllers/taskController');

router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/status', protect, updateTaskStatus);

module.exports = router;
