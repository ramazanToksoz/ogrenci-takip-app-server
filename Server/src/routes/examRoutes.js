const express = require('express');
const examController = require('../controllers/examController');
// const auth = require('../middleware/auth');

const router = express.Router();

// Öğretmen tarafından sınav oluşturma
router.post('/', examController.createExam);

// Öğretmenin kendi sınavlarını getirmesi
router.get('/teacher', examController.getTeacherExams);

// Öğrenciye uygun sınavları getirme
router.get('/student', examController.getStudentExams);

// Belirli bir sınavı ID'ye göre getirme
router.get('/:id', examController.getExamDetails);

// Sınav güncelleme
router.put('/:id', examController.updateExam);

// Sınav silme
router.delete('/:id', examController.deleteExam);

// Sınav yanıtlarını getirme
router.get('/:examId/results', examController.getExamResults);

module.exports = router;
