const express = require('express');
const { uploadProfileImage, handleProfileImageUpload } = require('../controllers/uploadController');
const router = express.Router();

// Profil resmi yükleme endpoint'i
router.post('/profile-image', handleProfileImageUpload, uploadProfileImage);

module.exports = router; 