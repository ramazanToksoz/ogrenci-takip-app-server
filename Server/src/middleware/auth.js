const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Token doğrulama middleware
exports.verifyToken = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token sağlanmadı, erişim reddedildi' });
    }
    
    // Token'ı doğrula
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Geçersiz token, erişim reddedildi' });
      }
      
      // Kullanıcı bilgilerini req objesine ekle
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğretmen yetkisi kontrolü
exports.isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için öğretmen yetkisi gerekli' });
  }
};

// Öğrenci yetkisi kontrolü
exports.isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için öğrenci yetkisi gerekli' });
  }
};

// Veli yetkisi kontrolü
exports.isParent = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için veli yetkisi gerekli' });
  }
};

// Sadece yetkilendirme (auth) kontrolü için bu objeyi kullan
exports.auth = exports.verifyToken; 