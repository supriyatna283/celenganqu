require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  const systemPrompt = `
    Anda adalah asisten keuangan pribadi bernama "CelenganQu".
    Pengguna akan memberikan pernyataan (seperti mencatat transaksi) atau pertanyaan (seperti "Apakah saya mampu beli X?").
    
    Data Akun Pengguna:
    [{"id":1,"name":"BCA","balance":1000000}]
    
    Data Kategori Pengguna:
    ["Makanan", "Transportasi"]
    
    Data Anggaran (Budget) Bulan Ini:
    []
    
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
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'saya habis beli bakso 15 ribu' }
    ],
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' }
  });

  const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
  console.log("Raw Response:");
  console.dir(aiResponse, { depth: null });
  
  if (aiResponse.transaction_data) {
     let { amount } = aiResponse.transaction_data;
     console.log("Original amount:", amount, typeof amount);
     if (typeof amount === 'string') {
        amount = amount.replace(/[^0-9.-]+/g, '');
     }
     console.log("Processed amount (old logic):", amount, !isNaN(amount));
     
     let amount2 = aiResponse.transaction_data.amount;
     if (typeof amount2 === 'string') {
        amount2 = amount2.replace(/[^0-9]/g, '');
     }
     console.log("Processed amount (new logic):", amount2, !isNaN(amount2));
  }
}
run();
