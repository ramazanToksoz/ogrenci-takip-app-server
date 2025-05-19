const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const StudentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  schoolNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir email giriniz']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  class: {
    type: String,
    required: true,
    enum: ['9', '10', '11', '12']
  },
  section: {
    type: String,
    default: 'A'
  },
  avatar: {
    type: String,
    default: ''
  },
  completedExams: [{
    exam: {
      type: Schema.Types.ObjectId,
      ref: 'Exam'
    },
    score: Number,
    completedAt: Date
  }],
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// Şifre şifreleme - kaydetmeden önce
StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre doğrulama metodu
StudentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Öğrencinin tam adını döndüren metod
StudentSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.surname}`;
});

// Öğrenci sınıf ve şube bilgisini döndüren metod
StudentSchema.virtual('classInfo').get(function() {
  return `${this.class}${this.section}`;
});

// JSON dönüşünde şifreyi gizle
StudentSchema.methods.toJSON = function() {
  const student = this.toObject();
  delete student.password;
  return student;
};

module.exports = mongoose.model('Student', StudentSchema); 