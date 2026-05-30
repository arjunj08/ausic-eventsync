const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  deleteRequest
} = require('../controllers/requestController');

router.get('/', protect, getAllRequests);
router.get('/:id', protect, getRequestById);
router.post('/', protect, createRequest);
router.patch('/:id/approve', protect, approveRequest);
router.patch('/:id/reject', protect, rejectRequest);
router.delete('/:id', protect, deleteRequest);

module.exports = router;
