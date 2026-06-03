import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import DebtLoans from './pages/DebtLoans';
import Subscriptions from './pages/Subscriptions';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#0f172a', 
            color: '#fff', 
            border: '1px solid #1e293b' 
          } 
        }} 
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/debts-loans" element={<DebtLoans />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
