const Account = require('../models/Account');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const SharedAccount = require('../models/SharedAccount');
const { Op } = require('sequelize');

exports.processChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Fetch user context
    const userAccounts = await Account.findAll({ where: { user_id: req.user.id, is_active: true } });
    const sharedAccounts = await SharedAccount.findAll({ 
      where: { user_id: req.user.id },
      include: [{ model: Account, as: 'account', where: { is_active: true } }]
    });
    
    const allAccounts = [
      ...userAccounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })),
      ...sharedAccounts.map(s => ({ id: s.account.id, name: s.account.name, balance: s.account.balance, shared: true }))
    ];

    const categories = await Category.findAll({ where: { user_id: req.user.id } });
    
    // Fetch budgets for this month
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const budgets = await Budget.findAll({ where: { user_id: req.user.id, period_month: currentMonth, period_year: currentYear } });

    // Calculate spent for budgets to pass to AI
    const budgetContext = await Promise.all(budgets.map(async b => {
      const spent = await Transaction.sum('amount', {
        where: {
          user_id: req.user.id,
          category: b.category,
          transaction_date: {
            [Op.between]: [
              `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
              new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
            ]
          }
        }
      }) || 0;
      return { category: b.category, limit: b.amount, spent: parseFloat(spent) };
    }));

    const systemPrompt = `
    Anda adalah asisten keuangan pribadi bernama "Duitku AI".
    Pengguna akan memberikan pernyataan (seperti mencatat transaksi) atau pertanyaan (seperti "Apakah saya mampu beli X?").
    
    Data Akun Pengguna:
    ${JSON.stringify(allAccounts)}
    
    Data Kategori Pengguna:
    ${JSON.stringify(categories.map(c => c.name))}
    
    Data Anggaran (Budget) Bulan Ini:
    ${JSON.stringify(budgetContext)}
    
    Anda harus membalas HANYA dengan format JSON yang memiliki struktur berikut:
    {
      "intent": "log_transaction" | "can_i_afford" | "general_advice",
      "reply": "Pesan balasan ramah dalam bahasa Indonesia santai (seperti teman) yang akan dibaca pengguna",
      "transaction_data": { // Hanya diisi jika intent == 'log_transaction', null jika tidak
        "type": "expense" | "income" | "transfer",
        "amount": 100000,
        "account_id": 1, // ID akun yang paling cocok dengan ucapan pengguna
        "category": "Makanan", // Harus persis dengan nama kategori pengguna, atau 'Lainnya' jika tidak ada
        "description": "Deskripsi transaksi"
      }
    }
    
    Jika intent adalah 'can_i_afford', analisis harga barang yang ingin dibeli pengguna, bandingkan dengan sisa saldo akun dan sisa budget mereka, lalu berikan saran yang masuk akal di dalam field 'reply'.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

    // If intent is log_transaction, we actually save it to DB
    if (aiResponse.intent === 'log_transaction' && aiResponse.transaction_data) {
      const { type, amount, account_id, category, description } = aiResponse.transaction_data;
      
      // Basic validation
      if (account_id) {
        const txDate = new Date().toISOString().split('T')[0];
        
        // Use the existing logic to create transaction
        await Transaction.create({
          user_id: req.user.id,
          account_id,
          type: type || 'expense',
          amount,
          category,
          description,
          transaction_date: txDate
        });

        // Update balance (simple inline update for AI, ideally we reuse transactionController's logic)
        const account = await Account.findByPk(account_id);
        if (account) {
          if (type === 'income') account.balance = parseFloat(account.balance) + parseFloat(amount);
          else if (type === 'expense') account.balance = parseFloat(account.balance) - parseFloat(amount);
          await account.save();
        }
      }
    }

    return res.status(200).json(aiResponse);
  } catch (error) {
    console.error('Chat error:', error);
    if (error.message && error.message.includes('429 Too Many Requests')) {
      return res.status(429).json({ 
        message: 'Batas harian penggunaan AI telah habis (limit kuota gratis). Silakan coba lagi nanti.',
        reply: 'Maaf ya, batas mikir aku hari ini udah habis karena pembatasan kuota Google API. Coba lagi dalam beberapa saat ya! 😅'
      });
    }
    return res.status(500).json({ message: 'Gagal memproses pesan AI.', error: error.message });
  }
};
