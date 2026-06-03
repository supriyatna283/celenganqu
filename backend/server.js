const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

// Load models to register associations
require('./models/User');
require('./models/Account');
require('./models/Transaction');
require('./models/Budget');
require('./models/Goal');
require('./models/Category');
require('./models/RecurringTransaction');
require('./models/DebtLoan');
require('./models/Notification');
require('./models/SharedAccount');

const app = express();

// Middleware
// Setup CORS dynamically to allow Vercel frontend or fallback to generic
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent caching for all API routes (especially for Hugging Face/Cloudflare caching)
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});
// Static Folder for Uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const insightRoutes = require('./routes/insightRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const debtLoanRoutes = require('./routes/debtLoanRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/v1/auth', authRoutes);
app.use('/v1/accounts', accountRoutes);
app.use('/v1/transactions', transactionRoutes);
app.use('/v1/budgets', budgetRoutes);
app.use('/v1/goals', goalRoutes);
app.use('/v1/insights', insightRoutes);
app.use('/v1/categories', categoryRoutes);
app.use('/v1/recurring', recurringRoutes);
app.use('/v1/debts-loans', debtLoanRoutes);
app.use('/v1/ocr', ocrRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/chat', chatRoutes);

// Root route
// trigger restart groq
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di Duitku API' });
});

// Database Sync and Server Start
// NOTE: { alter: true } is REMOVED to prevent ER_TOO_MANY_KEYS errors in production
const { startCron } = require('./cron/recurringCron');

sequelize.sync().then(() => {
  console.log('Database terhubung.');
  startCron(); // Start cron jobs
  
  // Gunakan PORT dari Hugging Face/Environment, jika tidak ada gunakan 7860
  const PORT = process.env.PORT || 7860;
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
}).catch(err => {
  console.error('Gagal menghubungkan ke database:', err);
});
