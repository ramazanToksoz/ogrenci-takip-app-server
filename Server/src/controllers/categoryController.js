const Category = require('../models/CategoryModel');


const addCategory = async (req, res) => {
  const { name } = req.body;

  try {
 
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Bu kategori zaten mevcut' });
    }

    
    const newCategory = new Category({
      name,
      
    });

    await newCategory.save();

    res.status(200).json({ message: 'Kategori başarıyla eklendi', newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Kategori eklenirken bir hata oluştu', error });
  }
};


const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (!categories) {
        return res.status(400).json({message:"Kategori Bulunamadı"})
    }
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Kategoriler alınırken bir hata oluştu', error });
  }
};

module.exports = { addCategory, getCategories };
