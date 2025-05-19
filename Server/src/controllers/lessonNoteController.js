const LessonNote = require('../models/LessonNoteModel');
const Lesson = require('../models/LessonModel');


exports.addLessonNote = async (req, res) => {
  const { lessonId } = req.params;
  const { topicTitle, topicDescription, teacherNotes } = req.body; 

  try {
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }


    const newLessonNote = new LessonNote({
      lesson: lessonId,
      topicTitle,
      topicDescription,
      teacherNotes,
    });

    await newLessonNote.save();

    res.status(200).json({ message: 'Ders notu başarıyla eklendi', newLessonNote });
  } catch (error) {
    res.status(500).json({ message: 'Ders notu eklenirken bir hata oluştu', error });
  }
};


exports.getLessonNotes = async (req, res) => {
  const { lessonId } = req.params; // Dersin ID'si

  try {
    const notes = await LessonNote.find({ lesson: lessonId });
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Ders notu bulunamadı' });
    }

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Ders notları alınırken bir hata oluştu', error });
  }
};

