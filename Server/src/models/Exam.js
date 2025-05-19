const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Soru seçenekleri için şema
const OptionSchema = new Schema({
  text: { 
    type: String, 
    required: true 
  },
  isCorrect: { 
    type: Boolean, 
    default: false 
  }
});

// Soru şeması
const QuestionSchema = new Schema({
  questionText: { 
    type: String, 
    required: true 
  },
  questionType: { 
    type: String, 
    enum: ['multiple_choice', 'open_ended', 'image_based'],
    required: true 
  },
  points: { 
    type: Number, 
    required: true, 
    min: 1,
    max: 100 
  },
  options: [OptionSchema], // Çoktan seçmeli sorular için
  correctAnswer: { 
    type: String, // Açık uçlu sorular için doğru cevap (opsiyonel)
    default: '' 
  },
  imageUrl: { 
    type: String, // Resim tabanlı sorular için (opsiyonel)
    default: '' 
  }
});

// Sınav şeması
const ExamSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  teacher: { 
    type: Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true 
  },
  branch: { 
    type: String, 
    required: true 
  },
  classLevel: { 
    type: String, 
    required: true 
  },
  section: { 
    type: String, 
    required: true 
  },
  examDate: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, // dakika cinsinden
    required: true, 
    min: 5,
    max: 180 
  },
  questions: [QuestionSchema],
  // Sınav ayarları
  settings: {
    randomizeQuestions: { 
      type: Boolean, 
      default: false 
    },
    passingScore: { 
      type: Number, 
      default: 50 
    },
    showResults: { 
      type: Boolean, 
      default: true 
    },
    allowRetake: { 
      type: Boolean, 
      default: false 
    }
  },
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Toplam puan hesapla
ExamSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, question) => sum + question.points, 0);
  } else {
    this.totalPoints = 0;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Exam', ExamSchema); 