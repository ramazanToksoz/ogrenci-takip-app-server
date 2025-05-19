const mongoose = require("mongoose");

const lessonNoteSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson", 
      required: true,
    },
    topicTitle: { type: String, required: true }, 
    topicDescription: { type: String }, 
    teacherNotes: { type: String }, 
    createdAt: { type: Date, default: Date.now }, 
  },
  { collection: "LessonNote" }
);

const LessonNote = mongoose.model("LessonNote", lessonNoteSchema);

module.exports = LessonNote;
