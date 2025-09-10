const express = require('express');
const router = express.Router();
const { register, login, getProfile, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes d'authentification
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/me', protect, me);

module.exports = router;
