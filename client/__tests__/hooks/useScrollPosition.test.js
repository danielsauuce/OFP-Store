import { renderHook, act } from '@testing-library/react';
import useScrollPosition from '../../src/hooks/useScrollPosition';

describe('useScrollPosition', () => {
  test('starts at 0', () => {
    const { result } = renderHook(() => useScrollPosition());

    expect(result.current).toBe(0);
  });

  test('updates when window scrolls', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      // Simulate scrolling by setting scrollY and firing event
      Object.defineProperty(window, 'scrollY', { value: 250, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(250);
  });

  test('tracks multiple scroll events', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(100);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(500);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(0);
  });

  test('cleans up event listener on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useScrollPosition());

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
