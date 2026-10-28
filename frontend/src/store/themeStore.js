import { create } from 'zustand';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('rb_darkMode') === 'true';
};

const useThemeStore = create((set) => ({
  darkMode: getInitialDarkMode(),
  
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    try {
      localStorage.setItem('rb_darkMode', String(newMode));
    } catch (e) {}
    return { darkMode: newMode };
  }),
  
  setDarkMode: (value) => {
    try {
      localStorage.setItem('rb_darkMode', String(value));
    } catch (e) {}
    set({ darkMode: value });
  },
}));

export default useThemeStore;