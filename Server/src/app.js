const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const studentRoutes = require("./routes/studentRoutes");
const lessonRoutes = require('./routes/lessonRoutes');
const lessonNoteRoutes = require('./routes/lessonsNoteRoutes');
const categoryRoutes =require("./routes/categoryRoutes")
const teacherRoutes=require("./routes/teacherRoutes")
const testRoutes=require("./routes/testRoutes")
const parentRoutes = require('./routes/parentRoutes');
const examResponseRoutes = require('./routes/examResponseRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/AssignmentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const app = express();
require("dotenv").config();
require("./config/db");
const port = process.env.PORT || 3001;

// CORS ayarları - Geliştirme aşamasında tüm originlere izin ver
app.use(cors({
  origin: '*', // Tüm originlere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(bodyParser.json());

// Statik dosya sunumu - uploads klasörü
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/lessons",lessonRoutes)
app.use("/api/v1/",lessonNoteRoutes)
app.use("/api/v1/categories",categoryRoutes)
app.use("/api/v1/teachers",teacherRoutes)
app.use("/api/v1/test",testRoutes)
app.use("/api/v1/parents", parentRoutes);
app.use("/api/v1/exam-responses", examResponseRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/upload", uploadRoutes);

app.listen(port, () => console.log(`Server listening on port ${port}!`));
