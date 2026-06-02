const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');

exports.getBudgets = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // 1. Fetch all budgets
    const budgets = await Budget.findAll({
      where: { user_id: req.user.id, period_month: month, period_year: year }
    });

    // 2. Fetch total spending per category for this month
    // Format start and end date of the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month

    const expenses = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        type: 'expense',
        transaction_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['category', [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total_spent']],
      group: ['category']
    });

    // Create a mapping of category -> total_spent
    const spentMap = {};
    expenses.forEach(e => {
      spentMap[e.category] = parseFloat(e.getDataValue('total_spent')) || 0;
    });

    // Merge budgets with total spent
    const result = budgets.map(b => {
      const budgetJson = b.toJSON();
      budgetJson.total_spent = spentMap[b.category] || 0;
      return budgetJson;
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('getBudgets error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data anggaran.' });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const { category, amount_limit, period_month, period_year } = req.body;

    if (!category || !amount_limit || !period_month || !period_year) {
      return res.status(400).json({ message: 'Kategori, batas nominal, bulan, dan tahun wajib diisi.' });
    }

    // Check if budget for this category and period already exists
    const existingBudget = await Budget.findOne({
      where: {
        user_id: req.user.id,
        category,
        period_month,
        period_year
      }
    });

    if (existingBudget) {
      return res.status(400).json({ message: `Anggaran untuk kategori ${category} di periode ini sudah ada.` });
    }

    const budget = await Budget.create({
      user_id: req.user.id,
      category,
      amount_limit,
      period_month,
      period_year
    });

    // Attach total_spent = 0 initially
    const result = budget.toJSON();
    result.total_spent = 0;

    return res.status(201).json(result);
  } catch (error) {
    console.error('createBudget error:', error);
    return res.status(500).json({ message: 'Gagal membuat anggaran.' });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_limit } = req.body;

    const budget = await Budget.findOne({ where: { id, user_id: req.user.id } });
    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan.' });
    }

    if (amount_limit !== undefined) {
      budget.amount_limit = amount_limit;
    }

    await budget.save();

    // Re-fetch spending
    const month = budget.period_month;
    const year = budget.period_year;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const totalSpent = await Transaction.sum('amount', {
      where: {
        user_id: req.user.id,
        category: budget.category,
        type: 'expense',
        transaction_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    }) || 0;

    const result = budget.toJSON();
    result.total_spent = parseFloat(totalSpent);

    return res.status(200).json(result);
  } catch (error) {
    console.error('updateBudget error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui anggaran.' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOne({ where: { id, user_id: req.user.id } });
    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan.' });
    }

    await budget.destroy();

    return res.status(200).json({ message: 'Anggaran berhasil dihapus.' });
  } catch (error) {
    console.error('deleteBudget error:', error);
    return res.status(500).json({ message: 'Gagal menghapus anggaran.' });
  }
};
