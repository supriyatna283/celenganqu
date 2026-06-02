import { create } from 'zustand';

const getInitialState = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      const user = JSON.parse(userStr);
      return { user, accessToken, refreshToken, isAuthenticated: true };
    }
  } catch (e) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
};

export const useAuthStore = create((set) => ({
  ...getInitialState(),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    }
  }
}));
