const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    schoolNumber: { type: String, required: true, unique: true },
    className: { 
      type: String, 
      required: true,
      default: '5',  // Varsayılan sınıf
      enum: ['5', '6', '7', '8'],  // Sınıf seçenekleri: 5, 6, 7, 8
    },
    section: { 
      type: String, 
      required: true,
      default: 'A',  // Varsayılan şube
      enum: ['A', 'B', 'C'],  // Şube seçenekleri: A, B, C
    },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],  // Öğrencinin kayıtlı olduğu dersler
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    grade:{type: Number, required:true},  // Öğrencinin velisi
    progress: [{ 
      lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },  // İlgili ders
      completed: { type: Boolean, default: false },  // Ders tamamlandı mı?
      score: { type: Number }  // Ders notu
    }],
    createdAt: { type: Date, default: Date.now }
  },{collection:"Student"});
  
  const Student = mongoose.model('Student', studentSchema);
  module.exports = Student;
  