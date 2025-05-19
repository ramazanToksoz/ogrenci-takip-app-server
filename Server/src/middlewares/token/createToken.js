const jwt = require('jsonwebtoken');

// Token oluşturma fonksiyonu
// Kullanıcı bilgilerini alır ve JWT token döndürür
const createToken = (payload) => {
  try {
    // JWT token oluştur
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '7d' } // 7 gün geçerli
    );
    
    // Token'ı doğrudan döndür
    return token;
  } catch (error) {
    console.error('Token oluşturma hatası:', error);
    throw new Error('Token oluşturulamadı: ' + error.message);
  }
};

module.exports = { createToken };
