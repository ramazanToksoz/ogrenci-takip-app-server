const express = require('express');
const { registerParent, loginParent, getParentById, getAllParents, updateParent } = require('../controllers/parentController');
const router = express.Router();

// Veli giriş ve kayıt
router.post('/register', registerParent);
router.post('/login', loginParent);

// Veli bilgileri
router.get('/', getAllParents);
router.get('/:id', getParentById);

// Veli bilgi güncelleme
router.put('/:id', updateParent);

module.exports = router;
