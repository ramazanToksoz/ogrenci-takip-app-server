const Exam = require('../models/Exam');
const ExamResponse = require('../models/ExamResponse');
const mongoose = require('mongoose');

// Student modeli import edilmeden Mongoose'dan çekilecek
// const Student = require('../models/Student');

// Sınav başlatma (öğrenci için)
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    // Öğrenci kontrolü
    const Student = mongoose.model('Student');
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // Sınav kontrolü
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // Sınav aktif mi kontrolü
    if (!exam.isActive) {
      return res.status(400).json({ message: 'Bu sınav şu anda aktif değil' });
    }

    // Öğrencinin sınıfı sınava uygun mu kontrolü
    if (exam.classId.toString() !== student.classId.toString()) {
      return res.status(403).json({ message: 'Bu sınav sizin sınıfınız için değil' });
    }

    // Daha önce bu sınava girmiş mi kontrolü
    const existingResponse = await ExamResponse.findOne({
      examId,
      studentId
    });

    if (existingResponse && existingResponse.isCompleted) {
      return res.status(400).json({ message: 'Bu sınavı daha önce tamamladınız' });
    }

    if (existingResponse && !existingResponse.isCompleted) {
      // Devam eden bir yanıt varsa, onu döndür
      return res.status(200).json({
        message: 'Devam eden sınav bulundu',
        response: existingResponse,
        exam: {
          ...exam.toObject(),
          questions: exam.questions.map(q => ({
            ...q,
            // Eğer çoktan seçmeli ise doğru cevabı gizle
            correctOption: q.type === 'multiple_choice' ? undefined : q.correctOption
          }))
        },
        remainingTime: existingResponse.endTime ? new Date(existingResponse.endTime) - new Date() : null
      });
    }

    // Yeni yanıt oluştur
    const endTime = exam.duration ? new Date(Date.now() + exam.duration * 60000) : null;
    
    const newResponse = new ExamResponse({
      examId,
      studentId,
      startTime: new Date(),
      endTime,
      answers: [],
      isCompleted: false,
      score: 0
    });

    await newResponse.save();

    // Sınav verilerini döndür, ancak doğru cevapları gösterme
    const examWithoutAnswers = {
      ...exam.toObject(),
      questions: exam.questions.map(q => ({
        ...q,
        // Eğer çoktan seçmeli ise doğru cevabı gizle
        correctOption: q.type === 'multiple_choice' ? undefined : q.correctOption
      }))
    };

    res.status(201).json({
      message: 'Sınav başarıyla başlatıldı',
      response: newResponse,
      exam: examWithoutAnswers,
      remainingTime: endTime ? endTime - new Date() : null
    });

  } catch (error) {
    console.error('Sınav başlatma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Cevap kaydetme
exports.saveAnswer = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { questionId, answer } = req.body;
    const studentId = req.user.id;

    // Yanıt kontrolü
    const response = await ExamResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Sınav yanıtı bulunamadı' });
    }

    // Öğrenci kontrolü
    if (response.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    // Tamamlanmış sınav kontrolü
    if (response.isCompleted) {
      return res.status(400).json({ message: 'Tamamlanmış sınava cevap eklenemez' });
    }

    // Süre kontrolü
    if (response.endTime && new Date() > new Date(response.endTime)) {
      return res.status(400).json({ message: 'Sınav süresi doldu' });
    }

    // Sınav kontrolü
    const exam = await Exam.findById(response.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // Soru kontrolü
    const question = exam.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }

    // Mevcut cevabı ara veya yeni ekle
    const existingAnswerIndex = response.answers.findIndex(a => a.questionId.toString() === questionId);
    
    if (existingAnswerIndex !== -1) {
      response.answers[existingAnswerIndex].answer = answer;
    } else {
      response.answers.push({
        questionId: mongoose.Types.ObjectId(questionId),
        answer
      });
    }
    
    await response.save();
    
    res.status(200).json({
      message: 'Cevap kaydedildi',
      answer: {
        questionId,
        answer
      }
    });

  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Sınavı tamamlama
exports.submitExam = async (req, res) => {
  try {
    const { responseId } = req.params;
    const studentId = req.user.id;

    // Yanıt kontrolü
    const response = await ExamResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Sınav yanıtı bulunamadı' });
    }

    // Öğrenci kontrolü
    if (response.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    // Tamamlanmış sınav kontrolü
    if (response.isCompleted) {
      return res.status(400).json({ message: 'Bu sınav zaten tamamlanmış' });
    }

    // Sınav kontrolü
    const exam = await Exam.findById(response.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // Puanlamayı yap
    let totalScore = 0;
    const scoredAnswers = response.answers.map(answer => {
      const question = exam.questions.find(q => q._id.toString() === answer.questionId.toString());
      
      if (!question) return answer;

      let isCorrect = false;
      let earnedPoints = 0;

      // Soru tipine göre değerlendirme
      if (question.type === 'multiple_choice') {
        isCorrect = answer.answer === question.correctOption;
        earnedPoints = isCorrect ? question.points : 0;
      } else if (question.type === 'open_ended' || question.type === 'image_upload') {
        // Açık uçlu ve görsel sorular için otomatik puanlama yapılmaz
        // Öğretmen değerlendirmesi için null bırakılır
        isCorrect = null;
        earnedPoints = null;
      }

      // Değerlendirme bilgilerini ekle
      answer.isCorrect = isCorrect;
      answer.earnedPoints = earnedPoints;
      
      // Puanlama yapılabilirse toplam puana ekle
      if (earnedPoints !== null) {
        totalScore += earnedPoints;
      }

      return answer;
    });

    response.answers = scoredAnswers;
    response.isCompleted = true;
    response.completionTime = new Date();
    response.score = totalScore;

    await response.save();

    res.status(200).json({
      message: 'Sınav başarıyla tamamlandı',
      response: {
        ...response.toObject(),
        // Sadece çoktan seçmeli sorular için puanlar
        score: totalScore,
        totalPossibleScore: exam.questions.reduce((total, q) => total + (q.type === 'multiple_choice' ? q.points : 0), 0),
        needsGrading: exam.questions.some(q => q.type !== 'multiple_choice')
      }
    });

  } catch (error) {
    console.error('Sınav tamamlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrencinin kendi yanıtlarını görüntülemesi
exports.getStudentResponses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Öğrenci kontrolü
    const Student = mongoose.model('Student');
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const responses = await ExamResponse.find({ studentId, isCompleted: true })
      .sort({ completionTime: -1 });

    if (!responses.length) {
      return res.status(200).json({ message: 'Henüz tamamlanmış sınav yanıtınız bulunmamaktadır', responses: [] });
    }

    // Her yanıt için sınav bilgilerini de ekle
    const responsesWithExams = await Promise.all(responses.map(async (response) => {
      const exam = await Exam.findById(response.examId, 'title description branch totalPoints');
      return {
        ...response.toObject(),
        exam: exam ? exam.toObject() : null
      };
    }));

    res.status(200).json({
      message: 'Sınav yanıtları başarıyla getirildi',
      responses: responsesWithExams
    });

  } catch (error) {
    console.error('Öğrenci yanıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrencinin belirli bir sınav yanıtını görüntülemesi
exports.getResponseById = async (req, res) => {
  try {
    const { responseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const response = await ExamResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Yanıt bulunamadı' });
    }

    const exam = await Exam.findById(response.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // Erişim kontrolü - sadece ilgili öğrenci veya sınavın öğretmeni erişebilir
    if (userRole === 'student' && response.studentId.toString() !== userId) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    if (userRole === 'teacher' && exam.teacherId.toString() !== userId) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    res.status(200).json({
      message: 'Yanıt başarıyla getirildi',
      response,
      exam
    });

  } catch (error) {
    console.error('Yanıt getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğretmen tarafından yanıt puanlaması
exports.gradeResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { questionGrades } = req.body;
    const teacherId = req.user.id;

    if (!Array.isArray(questionGrades)) {
      return res.status(400).json({ message: 'questionGrades bir dizi olmalıdır' });
    }

    const response = await ExamResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Yanıt bulunamadı' });
    }

    // Sınav kontrolü
    const exam = await Exam.findById(response.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // Öğretmen kontrolü
    if (exam.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu sınavı puanlama yetkiniz yok' });
    }

    // Puanlamayı güncelle
    let totalScore = 0;
    let hasChanges = false;

    questionGrades.forEach(grade => {
      const answerIndex = response.answers.findIndex(a => a.questionId.toString() === grade.questionId);
      if (answerIndex !== -1) {
        const question = exam.questions.find(q => q._id.toString() === grade.questionId);
        if (question && (question.type === 'open_ended' || question.type === 'image_upload')) {
          hasChanges = true;
          response.answers[answerIndex].earnedPoints = Math.min(grade.points, question.points);
          response.answers[answerIndex].feedback = grade.feedback;
          response.answers[answerIndex].isCorrect = grade.points > 0;
        }
      }
    });

    if (!hasChanges) {
      return res.status(400).json({ message: 'Puanlanacak soru bulunamadı' });
    }

    // Toplam puanı güncelle
    totalScore = response.answers.reduce((total, answer) => {
      return total + (answer.earnedPoints !== null ? answer.earnedPoints : 0);
    }, 0);

    response.score = totalScore;
    response.isGraded = true;
    response.gradedAt = new Date();
    response.gradedBy = teacherId;

    await response.save();

    res.status(200).json({
      message: 'Yanıt başarıyla puanlandı',
      score: totalScore,
      totalPossibleScore: exam.totalPoints
    });

  } catch (error) {
    console.error('Yanıt puanlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}; 