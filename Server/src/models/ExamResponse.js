const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Bir soruya verilen cevap şeması
const AnswerSchema = new Schema({
  questionId: { 
    type: String, 
    required: true 
  },
  selectedOption: { 
    type: String, // Çoktan seçmeli sorular için seçilen seçenek id'si (a, b, c, d, e, f gibi)
    default: null 
  },
  textAnswer: { 
    type: String, // Açık uçlu sorular için metin cevabı
    default: '' 
  },
  imageAnswer: { 
    type: String, // Resim tabanlı sorular için yüklenen resim URL'si
    default: '' 
  },
  isCorrect: { 
    type: Boolean, 
    default: false 
  },
  points: { 
    type: Number, 
    default: 0 
  },
  feedback: {
    type: String,
    default: ''
  },
  isGraded: { 
    type: Boolean, 
    default: false // Açık uçlu sorular için manuel değerlendirme gerekir
  }
});

// Öğrenci sınav yanıtları şeması
const ExamResponseSchema = new Schema({
  exam: { 
    type: Schema.Types.ObjectId, 
    ref: 'Exam', 
    required: true 
  },
  student: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date, 
    default: null 
  },
  answers: [AnswerSchema],
  status: {
    type: String,
    enum: ['started', 'submitted', 'graded'],
    default: 'started'
  },
  score: { 
    type: Number, 
    default: 0 
  },
  maxScore: {
    type: Number,
    default: 0
  },
  percentage: { 
    type: Number, 
    default: 0 
  },
  passed: { 
    type: Boolean, 
    default: false 
  },
  completionTime: { 
    type: Number, // dakika cinsinden
    default: 0 
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Sınav tamamlama metodu
ExamResponseSchema.methods.completeExam = function() {
  this.completedAt = new Date();
  this.status = 'submitted';
  
  // Tamamlanma süresini dakika cinsinden hesapla
  const startTime = this.startedAt.getTime();
  const endTime = this.completedAt.getTime();
  this.completionTime = Math.round((endTime - startTime) / (1000 * 60));
  
  // Çoktan seçmeli soruların puanlarını hesapla (açık uçlu sorular öğretmen tarafından değerlendirilecek)
  let score = 0;
  let autoGradedCount = 0;
  
  this.answers.forEach(answer => {
    if (answer.isCorrect === true) {
      score += answer.points;
      autoGradedCount++;
    }
  });
  
  this.score = score;
  
  return this;
};

// Öğretmen tarafından değerlendirme metodu
ExamResponseSchema.methods.gradeByTeacher = function(gradedAnswers, teacherId) {
  let totalScore = this.score; // Önceden otomatik değerlendirilen puanları dahil et
  
  gradedAnswers.forEach(gradedAnswer => {
    const answerIndex = this.answers.findIndex(a => a.questionId === gradedAnswer.questionId);
    
    if (answerIndex !== -1) {
      // Cevabı güncelle
      this.answers[answerIndex].isCorrect = gradedAnswer.isCorrect;
      this.answers[answerIndex].points = gradedAnswer.points;
      this.answers[answerIndex].feedback = gradedAnswer.feedback;
      this.answers[answerIndex].isGraded = true;
      
      // Toplam puanı güncelle
      totalScore += gradedAnswer.points;
    }
  });
  
  this.score = totalScore;
  this.status = 'graded';
  this.gradedBy = teacherId;
  this.gradedAt = new Date();
  
  return this;
};

module.exports = mongoose.model('ExamResponse', ExamResponseSchema); 