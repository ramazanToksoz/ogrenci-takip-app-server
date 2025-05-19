const Exam = require('../models/Exam');
const ExamResponse = require('../models/ExamResponse');
const Teacher = require('../models/TeacherModel');
const Student = require('../models/StudentModel');
const mongoose = require('mongoose');

// Öğretmen için sınav oluşturma
exports.createExam = async (req, res) => {
  try {
    const examData = req.body;
    
    // İsteğe bağlı öğretmen kontrolü
    if (examData.teacherId) {
      // Öğretmenin varlığını kontrol et
      const teacher = await Teacher.findById(examData.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Öğretmen bulunamadı' });
      }
      
      // Sınav verilerine öğretmen ID'sini ekle
      examData.teacher = examData.teacherId;
    } else if (req.user && req.user.id) {
      // Token varsa kullanıcı ID'sini al
      examData.teacher = req.user.id;
    } else {
      // Test için geçici sabit bir ID
      examData.teacher = "68064844ac441e734f3bb776"; // Testler için sabit bir ID
    }
    
    // teacherId'yi sil (bu sadece referans içindi)
    delete examData.teacherId;

    // Yeni sınav oluştur
    const exam = new Exam(examData);
    await exam.save();

    res.status(201).json({
      success: true,
      data: exam,
      message: 'Sınav başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Sınav oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğretmen sınavlarını listeleme
exports.getTeacherExams = async (req, res) => {
  try {
    const { teacherId } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'teacherId parametresi gereklidir.',
      });
    }

    const exams = await Exam.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .populate('teacher', 'name surname branch');

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error('Sınav listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınavlar listelenirken bir hata oluştu',
      error: error.message,
    });
  }
};


// Sınav detaylarını getirme
exports.getExamDetails = async (req, res) => {
  try {
    // ID'yi al (önce params, sonra query)
    const examId = req.params.id || req.params.examId || req.query.examId;
    
    if (!examId) {
      return res.status(400).json({ message: 'Sınav ID\'si belirtilmelidir' });
    }
    
    const exam = await Exam.findById(examId)
      .populate('teacher', 'name surname branch');
    
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Sınav detayı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav detayları alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Sınav güncelleme
exports.updateExam = async (req, res) => {
  try {
    // ID'yi al (önce params, sonra query)
    const examId = req.params.id || req.params.examId || req.query.examId;
    
    if (!examId) {
      return res.status(400).json({ message: 'Sınav ID\'si belirtilmelidir' });
    }
    
    const updateData = req.body;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Sınav başlamış mı kontrol et
    const hasResponses = await ExamResponse.exists({ exam: examId });
    if (hasResponses) {
      return res.status(400).json({ 
        message: 'Bu sınav başlatılmış, artık düzenlenemez' 
      });
    }
    
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedExam,
      message: 'Sınav başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sınav güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Sınav silme
exports.deleteExam = async (req, res) => {
  try {
    // ID'yi al (önce params, sonra query)
    const examId = req.params.id || req.params.examId || req.query.examId;
    
    if (!examId) {
      return res.status(400).json({ message: 'Sınav ID\'si belirtilmelidir' });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Sınav başlamış mı kontrol et
    const hasResponses = await ExamResponse.exists({ exam: examId });
    if (hasResponses) {
      return res.status(400).json({ 
        message: 'Bu sınav başlatılmış, artık silinemez' 
      });
    }
    
    await Exam.findByIdAndDelete(examId);
    
    res.status(200).json({
      success: true,
      message: 'Sınav başarıyla silindi'
    });
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğrenci için sınav listesi getirme
exports.getStudentExams = async (req, res) => {
  try {
    // Öğrenci ID'sini al (önce params, sonra query, sonra token, son olarak varsayılan test ID)
    const studentId = req.params.studentId || req.query.studentId || req.user?.id;
    
    // Öğrenci kontrolü (opsiyonel)
    let student = null;
    if (studentId) {
      student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Öğrenci bulunamadı' });
      }
    }

    // Sorgu kriterlerini hazırla
    const query = {};
    
    if (student) {
      // Öğrencinin sınıfına ve şubesine göre sınavları getir
      query.classLevel = student.className; // sınıf bilgisi (5, 6, 7, 8) 
      query.section = student.section;     // şube bilgisi (A, B, C)
      console.log(`Öğrenci ${student.className}-${student.section} sınıf/şube için sınavlar getiriliyor`);
    }
    
    // Sadece süresi dolmamış sınavlar
    query.dueDate = { $gte: new Date() };
    
    const exams = await Exam.find(query)
      .sort({ examDate: 1 })
      .populate('teacher', 'name surname branch');

    // Öğrencinin yanıtlarını kontrol et (eğer öğrenci ID'si varsa)
    let examsWithStatus = exams;
    
    if (studentId) {
      // Öğrencinin hangi sınavları çözdüğünü kontrol et
      const examResponses = await ExamResponse.find({
        student: studentId,
        exam: { $in: exams.map(exam => exam._id) }
      });

      // Sınav verilerine öğrencinin durumunu ekle
      examsWithStatus = exams.map(exam => {
        const response = examResponses.find(
          r => r.exam.toString() === exam._id.toString()
        );
        
        return {
          ...exam.toObject(),
          studentStatus: response ? response.status : 'not_started',
          studentScore: response ? response.score : null,
        };
      });
    }

    res.status(200).json({
      success: true,
      count: examsWithStatus.length,
      data: examsWithStatus
    });
  } catch (error) {
    console.error('Öğrenci sınavları listeme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Öğrenci sınavları listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğrenci için sınav başlatma
exports.startExam = async (req, res) => {
  try {
    // ID'leri al
    const examId = req.params.examId || req.query.examId;
    const studentId = req.params.studentId || req.query.studentId || req.user?.id || req.body.studentId || "test-student-id";
    
    if (!examId) {
      return res.status(400).json({ message: 'Sınav ID\'si belirtilmelidir' });
    }
    
    // Sınavın varlığını kontrol et
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Öğrencinin varlığını kontrol et (opsiyonel)
    let student = null;
    if (studentId) {
      try {
        student = await Student.findById(studentId);
      } catch (err) {
        console.log("Öğrenci bulunamadı, test modu devam ediyor:", err.message);
      }
    }
    
    // Sınavın süresinin dolup dolmadığını kontrol et
    if (new Date(exam.dueDate) < new Date()) {
      return res.status(400).json({ 
        message: 'Bu sınavın süresi dolmuş' 
      });
    }
    
    // Öğrencinin daha önce bu sınavı çözüp çözmediğini kontrol et
    let existingResponse = null;
    try {
      existingResponse = await ExamResponse.findOne({
        student: studentId,
        exam: examId
      });
    } catch (err) {
      console.log("Yanıt bulunamadı, yeni oluşturulacak:", err.message);
    }
    
    if (existingResponse && existingResponse.status === 'submitted') {
      return res.status(400).json({ 
        message: 'Bu sınavı daha önce tamamladınız' 
      });
    }
    
    // Eğer öğrenci sınavı başlatmış ama tamamlamamışsa devam etmesine izin ver
    if (existingResponse && existingResponse.status === 'started') {
      return res.status(200).json({
        success: true,
        data: existingResponse,
        message: 'Sınav devam ediyor'
      });
    }
    
    // Sınavı başlat ve soruları karıştır
    let questions = [...exam.questions];
    
    // Eğer soru karıştırma ayarı aktifse soruları karıştır
    if (exam.settings && exam.settings.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    
    // Boş cevap kağıdı oluştur
    const examResponse = new ExamResponse({
      student: studentId,
      exam: examId,
      answers: [],
      startedAt: new Date(),
      status: 'started'
    });
    
    await examResponse.save();
    
    res.status(200).json({
      success: true,
      data: {
        examResponse,
        exam: {
          ...exam.toObject(),
          questions: questions  // Karıştırılmış sorular
        }
      },
      message: 'Sınav başarıyla başlatıldı'
    });
  } catch (error) {
    console.error('Sınav başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav başlatılırken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğrenci sınav cevabı kaydetme
exports.submitAnswer = async (req, res) => {
  try {
    // ID'leri al
    const responseId = req.params.responseId || req.query.responseId || req.body.responseId;
    const studentId = req.params.studentId || req.query.studentId || req.user?.id || req.body.studentId || "test-student-id";
    const examId = req.params.examId || req.query.examId || req.body.examId;
    const { questionId, selectedOption } = req.body;

    if (!responseId) {
      return res.status(400).json({ message: 'Yanıt ID\'si belirtilmelidir' });
    }
    
    // Sınav cevap kağıdını kontrol et
    const examResponse = await ExamResponse.findById(responseId);
    if (!examResponse) {
      return res.status(404).json({ message: 'Sınav cevap kağıdı bulunamadı' });
    }
    
    // Sınav detaylarını getir
    const exam = await Exam.findById(examResponse.exam);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Soruyu bul
    const question = exam.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    
    // Cevabın doğru olup olmadığını kontrol et
    const isCorrect = question.correctAnswer === selectedOption;
    
    // Puanı hesapla
    const points = isCorrect ? question.points : 0;
    
    // Cevap kağıdında bu soruya daha önce cevap verilmiş mi kontrol et
    const existingAnswerIndex = examResponse.answers.findIndex(
      a => a.questionId === questionId
    );
    
    if (existingAnswerIndex !== -1) {
      // Mevcut cevabı güncelle
      examResponse.answers[existingAnswerIndex] = {
        questionId,
        selectedOption,
        isCorrect,
        points
      };
    } else {
      // Yeni cevap ekle
      examResponse.answers.push({
        questionId,
        selectedOption,
        isCorrect,
        points
      });
    }
    
    await examResponse.save();
    
    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        points,
        answer: {
          questionId,
          selectedOption,
          isCorrect,
          points
        }
      },
      message: 'Cevap başarıyla kaydedildi'
    });
  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Cevap kaydedilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğrenci sınav teslim etme
exports.submitExam = async (req, res) => {
  try {
    // ID'leri al
    const responseId = req.params.responseId || req.query.responseId || req.body.responseId;
    const studentId = req.params.studentId || req.query.studentId || req.user?.id || req.body.studentId || "test-student-id";
    const examId = req.params.examId || req.query.examId || req.body.examId;
    
    if (!responseId) {
      return res.status(400).json({ message: 'Yanıt ID\'si belirtilmelidir' });
    }
    
    // Sınav cevap kağıdını kontrol et
    const examResponse = await ExamResponse.findById(responseId);
    if (!examResponse) {
      return res.status(404).json({ message: 'Sınav cevap kağıdı bulunamadı' });
    }
    
    // Sınav durumunu kontrol et
    if (examResponse.status === 'submitted') {
      return res.status(400).json({ 
        message: 'Bu sınav zaten teslim edilmiş' 
      });
    }
    
    // Sınavı tamamla
    examResponse.completeExam();
    await examResponse.save();
    
    res.status(200).json({
      success: true,
      data: {
        score: examResponse.score,
        totalQuestions: examResponse.answers.length,
        correctAnswers: examResponse.answers.filter(a => a.isCorrect).length,
        completionTime: examResponse.completionTime
      },
      message: 'Sınav başarıyla teslim edildi'
    });
  } catch (error) {
    console.error('Sınav teslim hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav teslim edilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Öğretmen için sınav sonuçlarını listeleme
exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Sınavın varlığını kontrol et
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Sınav sonuçlarını getir
    const results = await ExamResponse.find({ exam: examId })
      .populate('student', 'name surname number className section')
      .sort({ score: -1 });
    
    // İstatistikleri hesapla
    const totalStudents = results.length;
    const completedExams = results.filter(r => r.status === 'submitted').length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalStudents || 0;
    
    // Soru bazlı istatistikler
    const questionStats = exam.questions.map(question => {
      const answers = results.flatMap(r => 
        r.answers.filter(a => a.questionId === question._id.toString())
      );
      
      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const correctPercentage = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
      
      return {
        questionId: question._id,
        questionText: question.text,
        totalAnswers,
        correctAnswers,
        correctPercentage
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        results,
        stats: {
          totalStudents,
          completedExams,
          averageScore,
          questionStats
        }
      }
    });
  } catch (error) {
    console.error('Sınav sonuçları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sınav sonuçları alınırken bir hata oluştu',
      error: error.message
    });
  }
};
