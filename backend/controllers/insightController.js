const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const { Op } = require('sequelize');
const { GoogleGenAI } = require('@google/genai');
const { processRecurringTransactions } = require('../utils/recurringProcessor');

exports.getInsights = async (req, res) => {
  try {
    // Process recurring transactions first!
    await processRecurringTransactions(req.user.id);

    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // 1. Fetch current month expenses
    const currentExpenses = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        type: 'expense',
        transaction_date: { [Op.between]: [startDate, endDate] }
      }
    });

    // 2. Fetch current month incomes
    const currentIncomes = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        type: 'income',
        transaction_date: { [Op.between]: [startDate, endDate] }
      }
    });

    // Sum totals
    const totalIncome = currentIncomes.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
    const totalExpense = currentExpenses.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
    const netSavings = totalIncome - totalExpense;

    // Aggregate category spendings
    const categorySpendMap = {};
    currentExpenses.forEach(tx => {
      categorySpendMap[tx.category] = (categorySpendMap[tx.category] || 0) + parseFloat(tx.amount);
    });

    // 3. Fetch budgets
    const budgets = await Budget.findAll({
      where: { user_id: req.user.id, period_month: month, period_year: year }
    });

    // 4. Fetch goals
    const goals = await Goal.findAll({
      where: { user_id: req.user.id }
    });

    // We will generate the default rule-based insights as a robust fallback
    const fallbackInsights = [];
    const budgetAlerts = []; // Gather explicit budget warnings for proactive popups

    budgets.forEach(b => {
      const limit = parseFloat(b.amount_limit);
      const spent = categorySpendMap[b.category] || 0;
      const ratio = spent / limit;

      if (ratio >= 1.0) {
        const alert = {
          type: 'danger',
          title: `Overlimit Anggaran ${b.category}`,
          description: `Pengeluaran ${b.category} Anda (Rp${spent.toLocaleString('id-ID')}) telah melebihi batas anggaran Rp${limit.toLocaleString('id-ID')}. Disarankan untuk menunda pengeluaran non-esensial kategori ini.`
        };
        fallbackInsights.push(alert);
        budgetAlerts.push(alert);
      } else if (ratio >= 0.8) {
        const alert = {
          type: 'warning',
          title: `Mendekati Limit Anggaran ${b.category}`,
          description: `Pengeluaran ${b.category} Anda sudah mencapai ${Math.round(ratio * 100)}% dari batas Rp${limit.toLocaleString('id-ID')}. Batasi pengeluaran kategori ini hingga akhir bulan.`
        };
        fallbackInsights.push(alert);
        budgetAlerts.push(alert);
      }
    });

    if (netSavings < 0) {
      fallbackInsights.push({
        type: 'danger',
        title: 'Arus Kas Negatif (Defisit)',
        description: `Bulan ini pengeluaran Anda lebih besar dari pemasukan dengan selisih Rp${Math.abs(netSavings).toLocaleString('id-ID')}. Tinjau kembali pos pengeluaran terbesar Anda.`
      });
    } else if (netSavings > 0) {
      const suggestSave = Math.round(netSavings * 0.3);
      fallbackInsights.push({
        type: 'success',
        title: 'Arus Kas Positif (Surplus)',
        description: `Bagus! Anda memiliki surplus Rp${netSavings.toLocaleString('id-ID')} bulan ini. Kami menyarankan untuk memindahkan Rp${suggestSave.toLocaleString('id-ID')} (30% dari surplus) ke target tabungan aktif Anda.`
      });
    }

    const expenseCategoriesCount = Object.keys(categorySpendMap).length;
    if (expenseCategoriesCount > 0) {
      let highestCat = '';
      let highestAmt = 0;
      Object.keys(categorySpendMap).forEach(cat => {
        if (categorySpendMap[cat] > highestAmt) {
          highestAmt = categorySpendMap[cat];
          highestCat = cat;
        }
      });

      if (highestCat) {
        fallbackInsights.push({
          type: 'info',
          title: `Pos Pengeluaran Terbesar: ${highestCat}`,
          description: `Kategori ${highestCat} memakan porsi terbesar pengeluaran Anda bulan ini (Rp${highestAmt.toLocaleString('id-ID')}). Cobalah cari alternatif penghematan untuk kategori ini.`
        });
      }
    } else {
      fallbackInsights.push({
        type: 'info',
        title: 'Mulai Catat Pengeluaran',
        description: 'Belum ada catatan pengeluaran bulan ini. Catat pengeluaran harian Anda agar sistem bisa menganalisis keuangan dengan lebih baik.'
      });
    }

    let finalInsights = fallbackInsights;
    let aiSummaryAnalysis = "Berikut adalah ringkasan keuangan berbasis data transaksi Anda.";

    // Gemini API integration if key exists
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Anda adalah 'Duitku AI', asisten perencana keuangan pribadi premium yang cerdas dan bersahabat. Berikut adalah ringkasan keuangan pengguna bulan ini (Bulan: ${month}, Tahun: ${year}):
- Total Pemasukan: Rp${totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${totalExpense.toLocaleString('id-ID')}
- Tabungan Bersih: Rp${netSavings.toLocaleString('id-ID')}
- Rincian Pengeluaran per Kategori: ${JSON.stringify(categorySpendMap)}
- Anggaran Kategori: ${JSON.stringify(budgets.map(b => ({ category: b.category, limit: parseFloat(b.amount_limit), spent: categorySpendMap[b.category] || 0 })))}
- Target Tabungan/Tujuan Keuangan: ${JSON.stringify(goals.map(g => ({ name: g.name, target: parseFloat(g.target_amount), current: parseFloat(g.current_amount) })))}

Berdasarkan data di atas, tolong berikan analisis keuangan terperinci dalam format JSON dengan struktur berikut:
{
  "summary_analysis": "analisis singkat ringkasan arus kas keseluruhan dalam 2-3 kalimat hangat dan informatif",
  "insights": [
    {
      "type": "danger|warning|success|info",
      "title": "Judul saran/temuan (maksimal 5 kata)",
      "description": "Penjelasan detail saran finansial konkret (1-2 kalimat) yang ramah dan solutif"
    }
  ]
}
Berikan 3-4 saran yang berkualitas tinggi. Pastikan jenis 'type' sesuai dengan sifat informasi (danger untuk pengeluaran berlebih/defisit, warning untuk mendekati limit/tabungan seret, success untuk pencapaian target/surplus, info untuk informasi umum).
PENTING: Hanya balas dengan objek JSON mentah yang valid, tanpa pembungkus markdown seperti \`\`\`json \`\`\`.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response && response.text) {
          const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          if (parsed.insights && Array.isArray(parsed.insights)) {
            finalInsights = parsed.insights;
          }
          if (parsed.summary_analysis) {
            aiSummaryAnalysis = parsed.summary_analysis;
          }
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to rule-based insights:', geminiError.message);
        // Fallback remains as finalInsights = fallbackInsights
      }
    } else {
      console.log('GEMINI_API_KEY is not defined. Using rule-based insights.');
    }

    return res.status(200).json({
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        month,
        year,
        aiSummaryAnalysis
      },
      insights: finalInsights,
      budgetAlerts // We supply this explicitly so frontend can push notification toasts
    });
  } catch (error) {
    console.error('getInsights error:', error);
    return res.status(500).json({ message: 'Gagal menganalisis keuangan.' });
  }
};
