const mongoose = require('mongoose');
const examScoreSchema = new mongoose.Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },  // Öğrenci
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },  // Sınav
    score: { type: Number, required: true },  // Öğrencinin sınavdan aldığı puan
    createdAt: { type: Date, default: Date.now }
  },{collection:"ExamScore"});
  
  const ExamScore = mongoose.model('ExamScore', examScoreSchema);
  module.exports = ExamScore;
  