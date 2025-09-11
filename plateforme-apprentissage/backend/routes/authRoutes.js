const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, me } = require('../controllers/authController');
const { uploadPhoto, deletePhoto } = require('../controllers/photoController');
const { protect } = require('../middleware/auth');

// Routes d'authentification
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/me', protect, me);

// Routes pour les photos
router.post('/upload-photo', protect, uploadPhoto);
router.delete('/delete-photo', protect, deletePhoto);

module.exports = router;
