import { create } from 'zustand';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useFinanceStore = create((set, get) => ({
  accounts: [],
  transactions: [],
  recurrings: [],
  budgets: [],
  goals: [],
  categories: [],
  recurringTemplates: [],
  debtsLoans: [],
  insights: null,
  loadingAccounts: false,
  loadingTransactions: false,
  loadingBudgets: false,
  loadingGoals: false,
  loadingCategories: false,
  loadingRecurring: false,
  loadingDebtsLoans: false,
  loadingScan: false,
  loadingInsights: false,
  error: null,

  // Global UI State
  hideNominal: localStorage.getItem('hideNominal') === 'true',
  toggleHideNominal: () => set((state) => {
    const newValue = !state.hideNominal;
    localStorage.setItem('hideNominal', newValue);
    return { hideNominal: newValue };
  }),

  // Selected filters for transactions
  filters: {
    accountId: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  },

  setFilter: (name, value) => {
    set((state) => ({
      filters: { ...state.filters, [name]: value }
    }));
    get().fetchTransactions();
  },

  resetFilters: () => {
    set({
      filters: {
        accountId: '',
        type: '',
        category: '',
        startDate: '',
        endDate: '',
      }
    });
    get().fetchTransactions();
  },

  // Accounts CRUD
  fetchAccounts: async () => {
    set({ loadingAccounts: true, error: null });
    try {
      const response = await api.get('/accounts');
      set({ accounts: response.data, loadingAccounts: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat akun.', loadingAccounts: false });
    }
  },

  createAccount: async (accountData) => {
    try {
      const response = await api.post('/accounts', accountData);
      set((state) => ({ accounts: [response.data, ...state.accounts] }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat akun.');
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);
      set((state) => ({
        accounts: state.accounts.map((acc) => acc.id === id ? response.data : acc)
      }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal memperbarui akun.');
    }
  },

  deleteAccount: async (id) => {
    try {
      await api.delete(`/accounts/${id}`);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus akun.');
    }
  },

  shareAccount: async (id, email, role) => {
    try {
      const response = await api.post(`/accounts/${id}/share`, { email, role });
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membagikan akun.');
    }
  },

  // Transactions CRUD
  fetchTransactions: async () => {
    set({ loadingTransactions: true, error: null });
    try {
      const { accountId, type, category, startDate, endDate } = get().filters;
      const params = {};
      if (accountId) params.account_id = accountId;
      if (type) params.type = type;
      if (category) params.category = category;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await api.get('/transactions', { params });
      set({ transactions: response.data, loadingTransactions: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat transaksi.', loadingTransactions: false });
    }
  },

  createTransaction: async (transactionData) => {
    try {
      const isFormData = transactionData instanceof FormData;
      const response = await api.post('/transactions', transactionData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      set((state) => ({
        transactions: [response.data, ...state.transactions]
      }));
      // Refresh accounts, budgets, and insights because spending/balances changed!
      get().fetchAccounts();
      get().fetchBudgets();
      get().fetchInsights();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat transaksi.');
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      const isFormData = transactionData instanceof FormData;
      const response = await api.put(`/transactions/${id}`, transactionData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      set((state) => ({
        transactions: state.transactions.map((tx) => tx.id === id ? response.data : tx)
      }));
      // Refresh accounts, budgets, and insights because spending/balances changed!
      get().fetchAccounts();
      get().fetchBudgets();
      get().fetchInsights();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal memperbarui transaksi.');
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      set((state) => ({
        transactions: state.transactions.filter((tx) => tx.id !== id)
      }));
      // Refresh accounts, budgets, and insights because spending/balances changed!
      get().fetchAccounts();
      get().fetchBudgets();
      get().fetchInsights();
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus transaksi.');
    }
  },

  exportCSV: async () => {
    try {
      const response = await api.get('/transactions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Transaksi_Duitku_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      throw new Error('Gagal mengekspor data.');
    }
  },

  importCSV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      get().fetchTransactions();
      get().fetchAccounts();
      get().fetchBudgets();
      get().fetchInsights();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal mengimpor data.');
    }
  },

  // Recurring Transactions
  fetchRecurrings: async () => {
    try {
      set({ loadingRecurrings: true });
      const response = await api.get('/recurring');
      set({ recurrings: response.data, loadingRecurrings: false });
    } catch (err) {
      console.error(err);
      set({ loadingRecurrings: false });
    }
  },

  createRecurring: async (data) => {
    try {
      const response = await api.post('/recurring', data);
      set((state) => ({
        recurrings: [response.data, ...state.recurrings]
      }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat tagihan rutin.');
    }
  },

  toggleRecurring: async (id) => {
    try {
      const response = await api.patch(`/recurring/${id}/toggle`);
      set((state) => ({
        recurrings: state.recurrings.map(r => r.id === id ? { ...r, is_active: response.data.is_active } : r)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal mengubah status tagihan.');
    }
  },

  deleteRecurring: async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      set((state) => ({
        recurrings: state.recurrings.filter(r => r.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus tagihan rutin.');
    }
  },

  // Budgets CRUD
  fetchBudgets: async (month, year) => {
    set({ loadingBudgets: true, error: null });
    try {
      const activeMonth = month || (new Date().getMonth() + 1);
      const activeYear = year || new Date().getFullYear();

      const response = await api.get('/budgets', {
        params: { month: activeMonth, year: activeYear }
      });
      set({ budgets: response.data, loadingBudgets: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat anggaran.', loadingBudgets: false });
    }
  },

  createBudget: async (budgetData) => {
    try {
      const response = await api.post('/budgets', budgetData);
      set((state) => ({ budgets: [response.data, ...state.budgets] }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat anggaran.');
    }
  },

  updateBudget: async (id, budgetData) => {
    try {
      const response = await api.put(`/budgets/${id}`, budgetData);
      set((state) => ({
        budgets: state.budgets.map((b) => b.id === id ? response.data : b)
      }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal memperbarui anggaran.');
    }
  },

  deleteBudget: async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus anggaran');
      throw new Error(err.response?.data?.message || 'Gagal menghapus anggaran.');
    }
  },

  copyPreviousBudgets: async (month, year) => {
    try {
      const res = await api.post('/budgets/copy-last-month', { month, year });
      // After success, re-fetch budgets
      await get().fetchBudgets(month, year);
      return res.data;
    } catch (error) {
      console.error('copyPreviousBudgets err:', error);
      throw new Error(error.response?.data?.message || 'Gagal menyalin anggaran');
    }
  },

  // Goals CRUD
  fetchGoals: async () => {
    set({ loadingGoals: true, error: null });
    try {
      const response = await api.get('/goals');
      set({ goals: response.data, loadingGoals: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat tujuan keuangan.', loadingGoals: false });
    }
  },

  createGoal: async (goalData) => {
    try {
      const response = await api.post('/goals', goalData);
      set((state) => ({ goals: [response.data, ...state.goals] }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat tujuan keuangan.');
    }
  },

  updateGoal: async (id, goalData) => {
    try {
      const response = await api.put(`/goals/${id}`, goalData);
      set((state) => ({
        goals: state.goals.map((g) => g.id === id ? response.data : g)
      }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal memperbarui tujuan keuangan.');
    }
  },

  deleteGoal: async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus tujuan keuangan.');
    }
  },

  depositToGoal: async (id, depositData) => {
    try {
      const response = await api.post(`/goals/${id}/deposit`, depositData);
      set((state) => ({
        goals: state.goals.map((g) => g.id === id ? response.data : g)
      }));
      // Refresh accounts, transactions, and insights because deposit is an expense transaction!
      get().fetchAccounts();
      get().fetchTransactions();
      get().fetchInsights();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menabung ke tujuan keuangan.');
    }
  },

  // Insights
  fetchInsights: async () => {
    set({ loadingInsights: true, error: null });
    try {
      const response = await api.get('/insights');
      set({ insights: response.data, loadingInsights: false });

      // Proactively trigger budget alert toasts if any exist
      if (response.data.budgetAlerts && response.data.budgetAlerts.length > 0) {
        response.data.budgetAlerts.forEach((alert) => {
          // Toast ID prevents duplicate toast notifications for the same alert
          const toastId = `budget-alert-${alert.title.replace(/\s+/g, '-')}`;
          if (alert.type === 'danger') {
            toast.error(alert.description, { id: toastId, duration: 6000 });
          } else {
            toast(alert.description, {
              id: toastId,
              icon: '⚠️',
              duration: 6000,
              style: {
                border: '1px solid #d97706',
                padding: '16px',
                color: '#78350f',
                background: '#fef3c7',
              }
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat analisis keuangan.', loadingInsights: false });
    }
  },

  // Categories CRUD
  fetchCategories: async () => {
    set({ loadingCategories: true, error: null });
    try {
      const response = await api.get('/categories');
      set({ categories: response.data, loadingCategories: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat kategori.', loadingCategories: false });
    }
  },

  createCustomCategory: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      set((state) => ({ categories: [...state.categories, response.data] }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat kategori.');
    }
  },

  deleteCustomCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus kategori.');
    }
  },

  // Recurring Templates CRUD
  fetchRecurringTemplates: async () => {
    set({ loadingRecurring: true, error: null });
    try {
      const response = await api.get('/recurring');
      set({ recurringTemplates: response.data, loadingRecurring: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat rencana transaksi rutin.', loadingRecurring: false });
    }
  },

  createRecurringTemplate: async (templateData) => {
    try {
      const response = await api.post('/recurring', templateData);
      set((state) => ({
        recurringTemplates: [response.data, ...state.recurringTemplates]
      }));
      // Trigger refresh of accounts and transactions in case it ran immediately
      get().fetchAccounts();
      get().fetchTransactions();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal membuat rencana transaksi rutin.');
    }
  },

  deleteRecurringTemplate: async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      set((state) => ({
        recurringTemplates: state.recurringTemplates.filter((t) => t.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus rencana transaksi.');
    }
  },

  toggleRecurringTemplate: async (id) => {
    try {
      const response = await api.patch(`/recurring/${id}/toggle`);
      set((state) => ({
        recurringTemplates: state.recurringTemplates.map((t) => t.id === id ? response.data : t)
      }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal merubah status rencana transaksi.');
    }
  },

  // Debts & Loans CRUD
  fetchDebtsLoans: async () => {
    set({ loadingDebtsLoans: true, error: null });
    try {
      const response = await api.get('/debts-loans');
      set({ debtsLoans: response.data, loadingDebtsLoans: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Gagal memuat catatan hutang-piutang.', loadingDebtsLoans: false });
    }
  },

  createDebtLoan: async (data) => {
    try {
      const response = await api.post('/debts-loans', data);
      set((state) => ({ debtsLoans: [response.data, ...state.debtsLoans] }));
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal mencatat hutang-piutang.');
    }
  },

  deleteDebtLoan: async (id) => {
    try {
      await api.delete(`/debts-loans/${id}`);
      set((state) => ({
        debtsLoans: state.debtsLoans.filter((d) => d.id !== id)
      }));
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal menghapus catatan hutang-piutang.');
    }
  },

  payDebtLoan: async (id, paymentData) => {
    try {
      const response = await api.post(`/debts-loans/${id}/pay`, paymentData);
      set((state) => ({
        debtsLoans: state.debtsLoans.map((d) => d.id === id ? response.data : d)
      }));
      // Trigger balance updates
      get().fetchAccounts();
      get().fetchTransactions();
      return response.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Gagal mencatat pembayaran.');
    }
  },

  // Receipt Scanner OCR
  scanReceipt: async (file) => {
    set({ loadingScan: true, error: null });
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const response = await api.post('/ocr/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      set({ loadingScan: false });
      return response.data;
    } catch (err) {
      console.error(err);
      set({ loadingScan: false });
      throw new Error(err.response?.data?.message || 'Gagal memindai struk. Pastikan GEMINI_API_KEY terkonfigurasi.');
    }
  }
}));
