const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']]
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ message: 'Gagal mengambil kategori.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi.' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Tipe kategori tidak valid.' });
    }

    // Check duplicate name for the same user
    const existing = await Category.findOne({
      where: {
        user_id: req.user.id,
        name: name.trim(),
        type
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Kategori dengan nama ini sudah ada.' });
    }

    const category = await Category.create({
      user_id: req.user.id,
      name: name.trim(),
      type,
      color: color || '#3B82F6',
      icon: icon || 'Folder'
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ message: 'Gagal membuat kategori.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan atau tidak memiliki akses.' });
    }

    await category.destroy();
    return res.status(200).json({ message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ message: 'Gagal menghapus kategori.' });
  }
};
