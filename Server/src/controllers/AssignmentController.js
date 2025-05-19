const Assignment = require('../models/AssignmentModel');

// Create a new assignment
exports.createAssignment = async (req, res) => {
    try {
        const { title, class: className, section, dueDate, description, teacherId, categoryId } = req.body;
        
        const assignment = new Assignment({
            title,
            class: className,
            section,
            dueDate,
            description,
            teacherId,
            categoryId
        });

        await assignment.save();
        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all assignments
exports.getAllAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate('teacherId', 'name email')
            .populate('categoryId', 'name');
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get assignments by class and section
exports.getAssignmentsByClassAndSection = async (req, res) => {
    try {
        const { class: className, section } = req.params;
        const assignments = await Assignment.find({ class: className, section })
            .populate('teacherId', 'name email')
            .populate('categoryId', 'name');
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get assignments by teacher
exports.getAssignmentsByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const assignments = await Assignment.find({ teacherId })
            .populate('teacherId', 'name email')
            .populate('categoryId', 'name');
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get a single assignment
exports.getAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('teacherId', 'name email')
            .populate('categoryId', 'name');
        
        if (!assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }
        
        res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('teacherId', 'name email')
         .populate('categoryId', 'name');

        if (!assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndDelete(req.params.id);

        if (!assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}; 