# Gunakan image Node.js versi LTS yang ringan
FROM node:18-alpine

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Instal semua dependensi
RUN npm install

# Salin seluruh kode backend
COPY . .

# Buat folder uploads jika belum ada (untuk OCR)
RUN mkdir -p uploads

# Buka port 7860 (Standar Hugging Face Spaces)
EXPOSE 7860

# Jalankan server
CMD ["node", "server.js"]
