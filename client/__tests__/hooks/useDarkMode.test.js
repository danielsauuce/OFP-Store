import { renderHook, act } from '@testing-library/react';
import useDarkMode from '../../src/hooks/useDarkMode';

beforeEach(() => {
  // Reset DOM and localStorage before each test
  localStorage.clear();
  document.documentElement.classList.remove('light', 'dark');
});

describe('useDarkMode', () => {
  test('defaults to "light" when localStorage is empty', () => {
    const { result } = renderHook(() => useDarkMode());
    const [theme] = result.current;

    expect(theme).toBe('light');
  });

  test('reads saved theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useDarkMode());
    const [theme] = result.current;

    expect(theme).toBe('dark');
  });

  test('adds theme class to document.documentElement', () => {
    renderHook(() => useDarkMode());

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('persists theme to localStorage', () => {
    renderHook(() => useDarkMode());

    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('switches to dark theme when setTheme is called', () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      const setTheme = result.current[1];
      setTheme('dark');
    });

    const [theme] = result.current;
    expect(theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('toggles back to light from dark', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useDarkMode());

    // Starts dark
    expect(result.current[0]).toBe('dark');

    // Toggle to light
    act(() => {
      result.current[1]('light');
    });

    expect(result.current[0]).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('removes opposite class when switching themes', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useDarkMode());

    // Default is light, should remove 'dark'
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
