const jwt = require('jsonwebtoken');
const SECRET_KEY = 'secretkey';  // Gerçek uygulamalarda bu anahtar gizli olmalı

// Middleware: Token kontrolü
const tokenMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];  // Authorization başlığındaki token'ı al

    if (!token) {
        return res.status(403).json({ message: 'Token gerekli' });
    }

    // 'Bearer ' kısmını temizleyerek sadece token'ı alıyoruz
    const cleanToken = token.replace('Bearer ', '');

    try {
        // Token'ı doğrulama
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET_KEY);
        req.user = decoded;  // Kullanıcı bilgilerini request objesine ekliyoruz
        next();  // Token geçerli, bir sonraki middleware'e geçiyoruz
    } catch (error) {
        res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }
};

module.exports = tokenMiddleware;
