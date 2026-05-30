const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { register, login, getUser, updateUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getUser);
router.put('/me', protect, updateUser);

module.exports = router;
