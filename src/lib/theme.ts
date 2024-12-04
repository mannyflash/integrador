import { getCookie, setCookie } from 'cookies-next';

export type Theme = 'light' | 'dark';

export const getTheme = (): Theme => {
  const theme = getCookie('theme');
  return theme === 'dark' ? 'dark' : 'light';
};

export const setTheme = (theme: Theme) => {
  setCookie('theme', theme, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
};

export const toggleTheme = (): Theme => {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
};

export const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

