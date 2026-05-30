const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
} = require('../controllers/teamController');

router.get('/', getAllTeams);
router.get('/:id', getTeamById);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members', protect, removeMember);

module.exports = router;
