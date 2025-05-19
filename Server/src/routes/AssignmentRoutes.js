const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getAllAssignments,
    getAssignmentsByClassAndSection,
    getAssignmentsByTeacher,
    getAssignment,
    updateAssignment,
    deleteAssignment
} = require('../controllers/AssignmentController');

// Create a new assignment
router.post('/', createAssignment);

// Get all assignments
router.get('/', getAllAssignments);

// Get assignments by class and section
router.get('/class/:class/section/:section', getAssignmentsByClassAndSection);

// Get assignments by teacher
router.get('/teacher/:teacherId', getAssignmentsByTeacher);

// Get a single assignment
router.get('/:id', getAssignment);

// Update an assignment
router.put('/:id', updateAssignment);

// Delete an assignment
router.delete('/:id', deleteAssignment);

module.exports = router; 