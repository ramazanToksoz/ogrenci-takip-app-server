const Student = require("../models/StudentModel");
const bcrypt = require('bcrypt');
const { createToken } = require("../middlewares/token/createToken");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching students", error });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, password, grade, schoolNumber } = req.body;
    
    // Email kontrolü
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Bu email adresi zaten kullanılıyor" });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      grade,
      schoolNumber
    });

    await newStudent.save();
    res.status(201).json({
      message: "Öğrenci başarıyla oluşturuldu",
      student: {
        id: newStudent._id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        grade: newStudent.grade,
        schoolNumber: newStudent.schoolNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Öğrenci oluşturulurken hata oluştu", error });
  }
};

exports.getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "error fetching student", error });
  }
};

exports.updateStudent = async (req, res) => {
  const { firstName, lastName, email, password, grade, schoolNumber } = req.body;
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "Student not found" });
  } else {
    try {
      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        {
          firstName,
          lastName,
          email,
          password,
          grade,
          schoolNumber
        },
       {new:true}
      );
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(200).json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Error updating student", error });
    }
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
   const deletedStudent= await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
       res.status(404).json({ message: "Student not found" });
    }
   return res.status(200).json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email kontrolü
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: "Email veya şifre hatalı" });
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email veya şifre hatalı" });
    }

    // JWT Token oluştur
    const token = createToken({
      id: student._id,
      email: student.email,
      type: 'student'
    });

    res.status(200).json({
      message: "Giriş başarılı",
      token: token,
      studentId: student._id,
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        grade: student.grade,
        schoolNumber: student.schoolNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Giriş yapılırken hata oluştu", error });
  }
};
