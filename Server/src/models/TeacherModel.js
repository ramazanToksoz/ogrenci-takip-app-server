const mongoose = require('mongoose');


const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String,required:true },
  password: { type: String, required: true },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],  
  branch: { type: mongoose.Schema.Types.ObjectId, ref:"Category", required:true},
  exams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],  
  profileImageUrl: { type: String, default: null },
  profileImageFilename: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
},{collection:"Teacher"});

const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;