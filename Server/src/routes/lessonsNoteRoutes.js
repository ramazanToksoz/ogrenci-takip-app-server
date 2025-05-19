const express = require("express");
const {
  addLessonNote,
  getLessonNotes,
} = require("../controllers/lessonNoteController");
const router = express.Router();

router.post("lessons/:lessonId/notes", addLessonNote);

router.get("lessons/:lessonId/notes", getLessonNotes);

module.exports = router;
