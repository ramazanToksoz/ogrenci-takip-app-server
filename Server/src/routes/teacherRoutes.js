const express = require('express');
const { getTeachers, updateTeacher, register, login, getTeacherStats, updateProfileImage } = require('../controllers/teacherController');
const router = express.Router()


router.get("/", getTeachers)
router.post("/register", register)
router.post("/login", login)
router.put("/", updateTeacher)
router.get("/stats/:teacherId", getTeacherStats)
router.put("/profile-image/:teacherId", updateProfileImage)

module.exports = router