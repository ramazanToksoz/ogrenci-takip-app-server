const express = require('express');
const router = express.Router();
const examResponseController = require('../controllers/examResponseController');
// const auth = require('../middleware/auth');


// Öğrenci için sınav başlatma
router.post('/start/:examId', examResponseController.startExam);

// Cevap kaydetme
router.post('/:responseId/answer', examResponseController.saveAnswer);

// Sınavı tamamlama
router.post('/:responseId/submit', examResponseController.submitExam);

// Öğrencinin kendi yanıtlarını görüntülemesi
router.get('/student', examResponseController.getStudentResponses);

// Yanıt detayını görüntüleme
router.get('/:responseId', examResponseController.getResponseById);

// Öğretmen tarafından puanlama
router.post('/:responseId/grade', examResponseController.gradeResponse);

module.exports = router; 