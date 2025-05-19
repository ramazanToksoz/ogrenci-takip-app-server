const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Teacher = require('../models/TeacherModel');

// Uploads dizini için yolların tanımlanması
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Uploads dizini kontrolü ve oluşturma
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Uploads dizini oluşturuldu:', UPLOADS_DIR);
  } catch (err) {
    console.error('Uploads dizini oluşturulamadı:', err);
  }
}

// Dosya yükleme ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Dosya yükleme başladı, hedef:', UPLOADS_DIR);
    
    // Dizin yoksa tekrar kontrol et
    if (!fs.existsSync(UPLOADS_DIR)) {
      try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      } catch (err) {
        return cb(new Error('Dosya yükleme dizini oluşturulamadı'));
      }
    }
    
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname) || '.jpg';
    const filename = 'profile-' + uniqueSuffix + extension;
    console.log('Yeni dosya adı:', filename);
    cb(null, filename);
  }
});

// Dosya tipi filtresi
const fileFilter = (req, file, cb) => {
  console.log('Dosya tipi kontrolü:', file.mimetype);
  
  // Sadece resim dosyalarına izin ver
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

// Multer upload middleware'i
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Profil resmi yükleme kontrolcüsü
const uploadProfileImage = async (req, res) => {
  console.log('uploadProfileImage çağrıldı', req.body);
  console.log('Yüklenen dosya:', req.file);
  
  try {
    // Dosya yoksa hata ver
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim dosyası yükleyin'
      });
    }

    const userId = req.body.userId;
    if (!userId) {
      // Dosyayı sil ve hata ver
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gereklidir'
      });
    }

    console.log('Öğretmen aranıyor, ID:', userId);
    
    // Dosya bilgileri
    const filename = req.file.filename;
    const imageUrl = `/uploads/${filename}`;

    // Öğretmen modelini güncelle
    let updatedTeacher;
    try {
      updatedTeacher = await Teacher.findByIdAndUpdate(
        userId,
        {
          profileImageUrl: imageUrl,
          profileImageFilename: filename
        },
        { new: true }
      );
    } catch (dbError) {
      console.error('Öğretmen güncellenirken hata:', dbError);
      
      // Dosyayı sil ve hata ver
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Veritabanı hatası',
        error: dbError.message
      });
    }

    if (!updatedTeacher) {
      console.error('Öğretmen bulunamadı, ID:', userId);
      
      // Dosyayı sil ve hata ver
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Öğretmen bulunamadı'
      });
    }

    console.log('Öğretmen güncellendi:', updatedTeacher);
    
    // Eski dosyayı sil (varsa)
    const oldFilename = req.body.oldFilename;
    if (oldFilename && oldFilename !== filename) {
      const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
      console.log('Eski dosya silinecek:', oldFilePath);
      
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log('Eski dosya silindi');
        } catch (err) {
          console.error('Eski dosya silinemedi:', err);
        }
      }
    }

    // Başarılı yanıt
    console.log('Başarılı yanıt gönderiliyor');
    
    return res.status(200).json({
      success: true,
      message: 'Profil resmi başarıyla yüklendi',
      imageUrl: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    
    // Dosyayı sil
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Multer için middleware fonksiyonu
const handleProfileImageUpload = (req, res, next) => {
  console.log('handleProfileImageUpload çağrıldı');
  
  upload.single('profileImage')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer hatası (örn. dosya boyutu aşıldı)
      console.error('Multer hatası:', err);
      
      return res.status(400).json({
        success: false,
        message: 'Dosya yükleme hatası',
        error: err.message
      });
    } else if (err) {
      // Bilinmeyen hata
      console.error('Bilinmeyen hata:', err);
      
      return res.status(500).json({
        success: false,
        message: 'Dosya yüklenirken beklenmeyen bir hata oluştu',
        error: err.message
      });
    }
    
    console.log('Dosya yükleme başarılı, sonraki middleware\'e geçiliyor');
    next();
  });
};

module.exports = {
  uploadProfileImage,
  handleProfileImageUpload
}; 