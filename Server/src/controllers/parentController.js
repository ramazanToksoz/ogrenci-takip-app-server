const { createToken } = require("../middlewares/token/createToken");
const Parent = require("../models/ParentModel");
const Student = require("../models/StudentModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require('mongoose');

// Veli Kaydı
const registerParent = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, studentSchoolNumber } = req.body;

    // Email kontrolü
    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kullanımda" });
    }

    // Öğrenci kontrolü
    const student = await Student.findOne({ schoolNumber: studentSchoolNumber });
    if (!student) {
      return res.status(404).json({ message: "Belirtilen okul numarasına sahip öğrenci bulunamadı" });
    }

    // Şifreleme
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Yeni veli oluştur
    const newParent = new Parent({
      firstName,
      lastName,
      email,
      phone,
      password: passwordHash,
      students: [student._id]
    });

    await newParent.save();

    // Öğrenci kaydını güncelle
    student.parent = newParent._id;
    await student.save();

    // Token oluştur
    const token = createToken({
      id: newParent._id,
      email: newParent.email,
      type: 'parent'
    });

    res.status(201).json({ 
      message: "Veli kaydı başarıyla oluşturuldu",
      token,
      parentId: newParent._id
    });

  } catch (error) {
    console.error("Veli kaydı hatası:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

// Veli Girişi
const loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Veli kaydını bul
    const parent = await Parent.findOne({ email });
    if (!parent) {
      return res.status(404).json({ message: "Kayıtlı veli bulunamadı" });
    }

    // Şifre kontrolü
    const passwordMatch = await bcrypt.compare(password, parent.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Geçersiz şifre" });
    }

    // Token oluştur
    const token = createToken({
      id: parent._id,
      email: parent.email,
      type: 'parent'
    });

    res.status(200).json({
      message: "Giriş başarılı",
      token,
      parentId: parent._id
    });

  } catch (error) {
    console.error("Veli girişi hatası:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

// Veli Bilgilerini Getir
const getParentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz veli ID formatı" });
    }

    const parent = await Parent.findById(id).select('-password');
    if (!parent) {
      return res.status(404).json({ message: "Veli bulunamadı" });
    }

    res.status(200).json(parent);
  } catch (error) {
    console.error("Veli bilgileri getirme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

// Tüm Velileri Getir
const getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find().select('-password');
    res.status(200).json(parents);
  } catch (error) {
    console.error("Velileri getirme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

// Veli Güncelleme
const updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz veli ID formatı" });
    }

    const parent = await Parent.findById(id);
    if (!parent) {
      return res.status(404).json({ message: "Veli bulunamadı" });
    }

    // Email kontrolü
    if (email && email !== parent.email) {
      const existingParent = await Parent.findOne({ email });
      if (existingParent) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kullanımda" });
      }
    }

    // Güncelleme
    const updatedParent = await Parent.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phone },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: "Veli bilgileri güncellendi",
      parent: updatedParent
    });

  } catch (error) {
    console.error("Veli güncelleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

module.exports = {
  registerParent,
  loginParent,
  getParentById,
  getAllParents,
  updateParent
};
