import { create } from 'zustand';

export const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null,
  onCancel: null,
  confirm: (title, message) => 
    new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          set({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          set({ isOpen: false });
          resolve(false);
        }
      });
    }),
  close: () => set({ isOpen: false })
}));
