const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const { Op } = require('sequelize');
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

    // Groq API integration if key exists
    if (process.env.GROQ_API_KEY) {
      try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const systemPrompt = `Anda adalah "CelenganQu AI", seorang perencana keuangan tersertifikasi (CFP) tingkat atas yang ahli menganalisis arus kas. Anda memberikan saran yang tajam, personal, dan bisa langsung dipraktikkan.
Gaya bahasa: Ramah, profesional, suportif, dan menggunakan bahasa Indonesia yang sangat natural (tidak kaku).
Tugas Anda: Analisis data keuangan pengguna dan berikan saran terbaik.

Balas HANYA dalam format JSON berikut (tanpa markdown, tanpa teks lain):
{
  "summary_analysis": "Analisis menyeluruh namun ringkas (3-4 kalimat) tentang kondisi arus kas bulan ini. Berikan pujian jika bagus, atau teguran halus yang membangun jika buruk.",
  "insights": [
    {
      "type": "danger", // Gunakan 'danger' untuk peringatan kritis (defisit/overbudget)
      "title": "Judul Saran 1",
      "description": "Deskripsi detail yang solutif"
    },
    {
      "type": "warning", // Gunakan 'warning' untuk hal yang perlu diwaspadai
      "title": "Judul Saran 2",
      "description": "..."
    },
    {
      "type": "success", // Gunakan 'success' untuk pencapaian baik
      "title": "Judul Saran 3",
      "description": "..."
    },
    {
      "type": "info", // Gunakan 'info' untuk saran umum/optimasi
      "title": "Judul Saran 4",
      "description": "..."
    }
  ]
}`;

        const userDataPrompt = `Data Keuangan Bulan Ini (Bulan ${month}/${year}):
- Pemasukan: Rp${totalIncome.toLocaleString('id-ID')}
- Pengeluaran: Rp${totalExpense.toLocaleString('id-ID')}
- Tabungan Bersih: Rp${netSavings.toLocaleString('id-ID')}
- Rincian Pengeluaran per Kategori: ${JSON.stringify(categorySpendMap)}
- Anggaran: ${JSON.stringify(budgets.map(b => ({ kategori: b.category, limit: parseFloat(b.amount_limit), terpakai: categorySpendMap[b.category] || 0 })))}
- Tujuan Tabungan: ${JSON.stringify(goals.map(g => ({ nama: g.name, target: parseFloat(g.target_amount), terkumpul: parseFloat(g.current_amount) })))}

Berikan 4 insight/saran keuangan yang SANGAT CERDAS, spesifik, dan personal berdasarkan angka-angka di atas. Jangan beri saran generik.`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userDataPrompt }
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' }
        });

        if (chatCompletion && chatCompletion.choices && chatCompletion.choices.length > 0) {
          const cleanText = chatCompletion.choices[0].message.content;
          const parsed = JSON.parse(cleanText);
          
          if (parsed.insights && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
            // Gabungkan insight dari AI dengan alert budget (danger/warning) dari sistem agar tidak hilang
            const systemCriticalAlerts = fallbackInsights.filter(i => i.type === 'danger' || i.type === 'warning');
            
            // Filter AI insights to make sure types are valid and not strictly duplicating system alerts
            const aiInsights = parsed.insights.map(i => ({
              type: ['danger', 'warning', 'success', 'info'].includes(i.type) ? i.type : 'info',
              title: i.title || 'Saran AI',
              description: i.description || ''
            })).filter(i => i.description.length > 0);

            // Prioritize system critical alerts at the top, then AI insights
            finalInsights = [...systemCriticalAlerts, ...aiInsights];
          }
          
          if (parsed.summary_analysis) {
            aiSummaryAnalysis = parsed.summary_analysis;
          }
        }
      } catch (aiError) {
        console.error('Groq API call failed, falling back to rule-based insights:', aiError.message);
        // Fallback remains as finalInsights = fallbackInsights
      }
    } else {
      console.log('GROQ_API_KEY is not defined. Using rule-based insights.');
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
