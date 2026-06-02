const { GoogleGenAI } = require('@google/genai');

exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file gambar struk yang diunggah.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'Fitur Scan Struk dinonaktifkan karena GEMINI_API_KEY belum dikonfigurasi di server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Format file for Gemini SDK
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };

    const prompt = `Anda adalah asisten keuangan AI 'Duitku OCR'. Tugas Anda adalah memindai dan mengekstrak rincian transaksi dari gambar struk belanja / bon ini.
Tolong ekstrak informasi berikut dan berikan jawaban HANYA dalam format JSON mentah tanpa pembungkus markdown (\`\`\`json \`\`\`):
{
  "amount": total_nominal_belanja_sebagai_angka (jika ada pajak/tax dan service, pastikan gunakan TOTAL AKHIR belanja),
  "category": "salah satu dari: Makanan & Minuman | Transportasi | Belanja | Hiburan | Tagihan & Utilitas | Kesehatan | Lainnya",
  "description": "nama merchant / toko + detail belanja singkat (misal: 'Starbucks - Pembelian Kopi' atau 'Indomaret - Belanja Bulanan')",
  "date": "tanggal transaksi dalam format YYYY-MM-DD (jika tahun tidak tertera di struk, gunakan tahun sekarang 2026)"
}
PENTING: Jangan berikan teks lain di luar objek JSON tersebut. Berikan data seakurat mungkin.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [imagePart, prompt],
    });

    if (!response || !response.text) {
      return res.status(500).json({ message: 'Gagal mengekstrak data dari struk.' });
    }

    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanText);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('scanReceipt error:', error);
    return res.status(500).json({ message: 'Gagal memproses struk. Pastikan gambar jelas dan memiliki teks terstruktur.' });
  }
};
