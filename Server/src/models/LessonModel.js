const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    grade: { 
      type: String, 
      required: true, 
      enum: ['5', '6', '7', '8'],
    },
    section: { 
      type: String, 
      required: true,
      enum: ['A', 'B', 'C'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    note: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    topics: [
      {
        topicTitle: { type: String, required: true },
        topicDescription: { type: String }, 
        teacherNotes: { type: String }, 
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "Lesson" }
);

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
