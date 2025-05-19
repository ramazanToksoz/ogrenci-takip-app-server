const express = require("express");
const {
  createLesson,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  getTeacherLessons,
  upload
} = require("../controllers/lessonController");

const router = express.Router();

// Dosya yükleme gerektiren route'lar
router.post("/", upload.single('lessonFile'), createLesson);
router.put("/:id", upload.single('lessonFile'), updateLesson);

// Standart route'lar
router.get("/", getAllLessons);
router.get("/:id", getLessonById);
router.delete("/:id", deleteLesson);

// Öğretmen dersleri
router.get("/teacher/:teacherId", getTeacherLessons);

module.exports = router;
