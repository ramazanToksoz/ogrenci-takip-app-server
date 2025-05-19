const Lesson = require('../models/LessonModel');
const Teacher = require('../models/TeacherModel');
const Student = require('../models/StudentModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dosya yükleme için multer ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/lessons');
    
    // Dizin yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Özgün dosya adı oluştur: zaman damgası + özgün isim
    const uniqueFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueFileName);
  }
});

// Dosya filtresi (pdf, doc, docx)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Geçersiz dosya türü! Sadece PDF, DOC ve DOCX dosyaları yükleyebilirsiniz.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const createLesson = async (req, res) => {
  try {
    // Form verilerini al
    const { title, note, grade, section, teacherId, categoryId } = req.body;
    
    // Öğretmen ve kategori kontrolleri
    if (!title || !grade || !section || !teacherId || !categoryId) {
      return res.status(400).json({ 
        success: false,
        message: 'Eksik bilgi! Ders adı, sınıf, şube, öğretmen ID ve kategori ID gereklidir.'
      });
    }
    
    // Öğretmen var mı kontrol et
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Öğretmen bulunamadı'
      });
    }
    
    // Dosya bilgilerini hazırla (eğer yüklendiyse)
    let fileData = {};
    if (req.file) {
      fileData = {
        fileUrl: `/uploads/lessons/${req.file.filename}`,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }
    
    // Ders nesnesini oluştur
    const newLesson = new Lesson({
      title,
      description: title,
      teacher: teacherId,
      grade,
      section,
      category: categoryId,
      note: note || '',
      ...fileData,
      students: [] // Başlangıçta boş öğrenci listesi
    });
    
    // Dersi kaydet
    const savedLesson = await newLesson.save();
    
    // Öğretmenin derslerine yeni dersi ekle
    teacher.lessons.push(savedLesson._id);
    await teacher.save();
    
    // Sınıf ve şubeye ait öğrencileri bul
    const matchingStudents = await Student.find({ 
      className: grade,
      section: section
    });
    
    // Öğrencilerin derslerine yeni dersi ekle
    if (matchingStudents.length > 0) {
      const updatePromises = matchingStudents.map(async (student) => {
        student.lessons.push(savedLesson._id);
        await student.save();
        
        // Dersin öğrencilerine bu öğrenciyi ekle
        savedLesson.students.push(student._id);
      });
      
      await Promise.all(updatePromises);
      await savedLesson.save(); // Güncellenen öğrenci listesini kaydet
    }
    
    // Başarılı yanıt
    res.status(201).json({
      success: true,
      message: 'Ders başarıyla oluşturuldu',
      lesson: savedLesson
    });
  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Ders oluşturulurken bir hata oluştu', 
      error: error.message 
    });
  }
};

const getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate('teacher', 'firstName lastName email')
      .populate('category', 'name')
      .populate('students', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: lessons.length,
      lessons
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Dersler alınırken bir hata oluştu', 
      error: error.message 
    });
  }
};

const getLessonById = async (req, res) => {
  try {
    const lessonId = req.params.id;
    
    const lesson = await Lesson.findById(lessonId)
      .populate('teacher', 'firstName lastName email')
      .populate('category', 'name')
      .populate('students', 'firstName lastName email');
    
    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Ders bulunamadı' 
      });
    }
    
    res.status(200).json({
      success: true,
      lesson
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Ders alınırken bir hata oluştu', 
      error: error.message 
    });
  }
};

const updateLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const updates = req.body;
    
    // Dosya bilgilerini güncelle (eğer yüklendiyse)
    if (req.file) {
      updates.fileUrl = `/uploads/lessons/${req.file.filename}`;
      updates.fileName = req.file.originalname;
      updates.fileType = req.file.mimetype;
      updates.fileSize = req.file.size;
      
      // Eski dosyayı sil (eğer varsa)
      const oldLesson = await Lesson.findById(lessonId);
      if (oldLesson && oldLesson.fileUrl) {
        const oldFilePath = path.join(__dirname, '../..', oldLesson.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }
    
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('teacher', 'firstName lastName email')
    .populate('category', 'name')
    .populate('students', 'firstName lastName email');
    
    if (!updatedLesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Güncellenecek ders bulunamadı' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Ders başarıyla güncellendi',
      lesson: updatedLesson
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Ders güncellenirken bir hata oluştu', 
      error: error.message 
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;
    
    // Dersi bul
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Silinecek ders bulunamadı' 
      });
    }
    
    // Eğer yüklü bir dosya varsa, dosyayı sil
    if (lesson.fileUrl) {
      const filePath = path.join(__dirname, '../..', lesson.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Öğretmenden dersi kaldır
    await Teacher.updateOne(
      { _id: lesson.teacher },
      { $pull: { lessons: lessonId } }
    );
    
    // Tüm öğrencilerden dersi kaldır
    await Student.updateMany(
      { _id: { $in: lesson.students } },
      { $pull: { lessons: lessonId } }
    );
    
    // Dersi sil
    await lesson.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Ders başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Ders silinirken bir hata oluştu', 
      error: error.message 
    });
  }
};

// Öğretmenin derslerini getir
const getTeacherLessons = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    const lessons = await Lesson.find({ teacher: teacherId })
      .populate('category', 'name')
      .populate('students', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: lessons.length,
      lessons
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Öğretmen dersleri alınırken bir hata oluştu', 
      error: error.message 
    });
  }
};

module.exports = {
  createLesson,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  getTeacherLessons,
  upload // multer upload nesnesini dışa aktar
};