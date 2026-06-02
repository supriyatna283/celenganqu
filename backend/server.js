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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di Duitku API' });
});

// Database Sync and Server Listen
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
  });
// Trigger nodemon restart after database keys fix and env updates
