const mongoose = require('mongoose');
const parentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],  // Velinin çocukları (Öğrencileri)
    createdAt: { type: Date, default: Date.now }
  },{collection:"Parent"});
  
  const Parent = mongoose.model('Parent', parentSchema);
  module.exports = Parent;
  