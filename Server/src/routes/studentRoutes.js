const express = require('express');
const { getAllStudents, createStudent, getStudentById, updateStudent, deleteStudent, loginStudent } = require('../controllers/studentController');
const router = express.Router();

// Login route
router.post("/login", loginStudent);

// CRUD routes
router.get("/", getAllStudents);
router.get("/:id", getStudentById);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;