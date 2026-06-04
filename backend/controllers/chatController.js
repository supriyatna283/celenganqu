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
Anda adalah asisten keuangan pribadi bernama "CelenganQu". Balas HANYA dalam format JSON.

=== DATA AKUN PENGGUNA ===
${JSON.stringify(allAccounts)}
PENTING: Gunakan "id" dari daftar di atas sebagai nilai "account_id". JANGAN gunakan angka sembarang seperti 1, 2, atau 3.

=== DATA KATEGORI PENGGUNA ===
${JSON.stringify(categories.map(c => c.name))}

=== DATA ANGGARAN BULAN INI ===
${JSON.stringify(budgetContext)}

=== ATURAN WAJIB UNTUK "type" ===
- "expense" (PENGELUARAN): Jika pengguna MEMBELI, BAYAR, BELANJA, KELUAR uang, MAKAN, BELI sesuatu, ATAU jika pengguna menyebut TRANSFER/KIRIM uang. Contoh: "beli baso", "bayar listrik", "transfer dari BCA". KATA KUNCI: beli, bayar, belanja, transfer, kirim, makan, jajan, keluar, habis. (Semua transfer via AI dicatat sebagai expense).
- "income" (PEMASUKAN): Jika pengguna MENERIMA, DAPAT, GAJIAN, MASUK uang. Contoh: "terima gaji", "dapat bonus", "pemasukan dari freelance". KATA KUNCI: terima, dapat, masuk, gaji, bonus, pemasukan.
INGAT: Kata "dari" dalam konteks PEMBELIAN (misal "beli baso dari Gopay") berarti sumber pembayaran, BUKAN pemasukan. Itu tetap "expense".

=== FORMAT RESPONS JSON ===
{
  "intent": "log_transaction" | "can_i_afford" | "general_advice",
  "reply": "Pesan balasan santai bahasa Indonesia gaul yang menyebutkan detail spesifik transaksi (nama akun, jumlah, deskripsi)",
  "transaction_data": {
    "type": "expense" | "income",
    "amount": 50000,
    "account_id": <gunakan ID PERSIS dari daftar akun di atas>,
    "category": "<nama kategori PERSIS dari daftar kategori, atau 'Lainnya' jika tidak ada yang cocok>",
    "description": "deskripsi singkat"
  }
}
Jika bukan log_transaction, set "transaction_data" ke null.
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
    console.log("AI Response:", aiResponse);

    // If intent is log_transaction, we actually save it to DB
    if (aiResponse.intent === 'log_transaction' && aiResponse.transaction_data) {
      let { type, amount, account_id, category, description } = aiResponse.transaction_data;
      
      // Fallback: AI should not output transfer, but if it hallucinates one, treat it as expense
      if (type === 'transfer') type = 'expense';

      console.log("Extracted Data:", { type, amount, account_id, category, description });

      // AI seringkali gagal menentukan account_id jika pengguna tidak menyebutkannya.
      // Atau AI memilih ID yang salah (misal: 1, 2) yang bukan milik user.
      // Validasi: pastikan account_id yang dipilih AI ada di daftar akun user.
      const validAccountIds = allAccounts.map(a => a.id);
      if (!account_id || !validAccountIds.includes(parseInt(account_id))) {
        // Coba cocokkan nama akun dari 'reply' AI dengan nama akun user
        const replyLower = (aiResponse.reply || '').toLowerCase();
        const matchedAccount = allAccounts.find(a => replyLower.includes(a.name.toLowerCase()));
        if (matchedAccount) {
          account_id = matchedAccount.id;
          console.log("Matched account_id from reply text:", account_id, matchedAccount.name);
        } else {
          account_id = allAccounts[0].id;
          console.log("Applied fallback account_id (first account):", account_id);
        }
      } else {
        account_id = parseInt(account_id);
        console.log("Validated account_id:", account_id);
      }

      // Pastikan category terisi, jika tidak fallback ke 'Lainnya'
      if (!category) {
        category = 'Lainnya';
        console.log("Applied fallback category:", category);
      }

      // Bersihkan format angka jika AI mengirimkan string seperti "50.000", "50,000", atau "Rp50000"
      if (typeof amount === 'string') {
        // Hapus semua karakter selain angka (menghapus titik, koma, Rp, spasi)
        // Pengecualian jika AI benar-benar mengirim desimal (sangat jarang untuk IDR)
        amount = amount.replace(/[^0-9]/g, ''); 
      }

      console.log("Processed Data before save:", { account_id, amount, isNaN_amount: isNaN(amount) });

      // HANYA simpan jika amount adalah angka yang valid dan account_id ada
      if (account_id && amount && !isNaN(amount)) {
        const txDate = new Date().toISOString().split('T')[0];

        // Use the existing logic to create transaction
        await Transaction.create({
          user_id: req.user.id,
          account_id,
          type: type || 'expense',
          amount: parseFloat(amount),
          category,
          description: description || 'Transaksi via AI',
          transaction_date: txDate
        });
        
        console.log("Transaction successfully saved to DB!");

        // Update balance (simple inline update for AI, ideally we reuse transactionController's logic)
        const account = await Account.findByPk(account_id);
        if (account) {
          if (type === 'income') account.balance = parseFloat(account.balance) + parseFloat(amount);
          else if (type === 'expense') account.balance = parseFloat(account.balance) - parseFloat(amount);
          await account.save();
        }
      } else {
        console.log("Transaction creation skipped due to validation failure.");
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
