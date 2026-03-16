import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '../../src/components/ProductCard';

/* ── Mocks ────────────────────────────────────────────────── */
jest.mock('../../src/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockAddItem = jest.fn();
let mockAuth = { authenticate: true, user: { fullName: 'Daniel' } };

jest.mock('../../src/context/authContext', () => ({
  useAuth: () => ({ auth: mockAuth }),
}));

jest.mock('../../src/context/cartContext', () => ({
  useCart: () => ({ addItem: mockAddItem }),
}));

/* ── Toast mock ───────────────────────────────────────────
   Variables prefixed with `mock` are allowed inside hoisted
   jest.mock factories. We define them here so both the factory
   AND our test assertions reference the exact same jest.fn(). */
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastLoading = jest.fn();
const mockToastDismiss = jest.fn();

jest.mock('react-hot-toast', () => {
  const t = (...args) => mockToastSuccess(...args);
  t.success = mockToastSuccess;
  t.error = mockToastError;
  t.loading = mockToastLoading;
  t.dismiss = mockToastDismiss;
  return { __esModule: true, default: t };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { authenticate: true, user: { fullName: 'Daniel' } };
});

const baseProduct = {
  _id: 'prod1',
  name: 'Modern Sofa',
  price: 499.99,
  category: { name: 'Living Room' },
  primaryImage: { secureUrl: 'https://cdn.test.com/sofa.jpg' },
};

/* ═══════════════════════════════════════════════════════════ */
describe('ProductCard', () => {
  /* ── Rendering ──────────────────────────────────────────── */
  test('renders product name, price, and category', () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText('Modern Sofa')).toBeInTheDocument();
    expect(screen.getByText('£499.99')).toBeInTheDocument();
    expect(screen.getByText('Living Room')).toBeInTheDocument();
  });

  test('renders product image when primaryImage.secureUrl exists', () => {
    render(<ProductCard product={baseProduct} />);

    const img = screen.getByAltText('Modern Sofa');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.test.com/sofa.jpg');
  });

  test('renders "No image" placeholder when no valid image', () => {
    const noImageProduct = { ...baseProduct, primaryImage: null, image: null };
    render(<ProductCard product={noImageProduct} />);

    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  test('renders Add to Cart button', () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  /* ── Image resolution fallbacks ─────────────────────────── */
  test('uses primaryImage.url as fallback', () => {
    const product = {
      ...baseProduct,
      primaryImage: { url: 'https://cdn.test.com/sofa-url.jpg' },
    };
    render(<ProductCard product={product} />);

    expect(screen.getByAltText('Modern Sofa')).toHaveAttribute(
      'src',
      'https://cdn.test.com/sofa-url.jpg',
    );
  });

  test('uses string primaryImage when not an ObjectId', () => {
    const product = {
      ...baseProduct,
      primaryImage: 'https://cdn.test.com/sofa-string.jpg',
    };
    render(<ProductCard product={product} />);

    expect(screen.getByAltText('Modern Sofa')).toHaveAttribute(
      'src',
      'https://cdn.test.com/sofa-string.jpg',
    );
  });

  test('falls back to image field when primaryImage is ObjectId', () => {
    const product = {
      ...baseProduct,
      primaryImage: '507f1f77bcf86cd799439011',
      image: { secureUrl: 'https://cdn.test.com/fallback.jpg' },
    };
    render(<ProductCard product={product} />);

    expect(screen.getByAltText('Modern Sofa')).toHaveAttribute(
      'src',
      'https://cdn.test.com/fallback.jpg',
    );
  });

  /* ── Add to cart (authenticated) ────────────────────────── */
  test('calls addItem on click when authenticated', async () => {
    mockAddItem.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} />);
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('prod1', 1);
    });
  });

  test('shows success toast after adding to cart', async () => {
    mockAddItem.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} />);
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Modern Sofa added to cart');
    });
  });

  test('shows "Adding..." text while request is in flight', async () => {
    mockAddItem.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} />);
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  /* ── Add to cart (unauthenticated) ──────────────────────── */
  test('redirects to /auth when not logged in', async () => {
    mockAuth = { authenticate: false, user: null };
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} />);
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(mockToastError).toHaveBeenCalledWith('Please login to add items to cart');
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  /* ── Product links ──────────────────────────────────────── */
  test('links to product detail page', () => {
    render(<ProductCard product={baseProduct} />);

    const links = screen.getAllByRole('link');
    const productLinks = links.filter((l) => l.getAttribute('href') === '/product/prod1');
    expect(productLinks.length).toBeGreaterThanOrEqual(1);
  });

  /* ── Edge cases ─────────────────────────────────────────── */
  test('uses title field as fallback for name', () => {
    const product = { ...baseProduct, name: undefined, title: 'Elegant Table' };
    render(<ProductCard product={product} />);

    expect(screen.getByText('Elegant Table')).toBeInTheDocument();
  });

  test('handles string category', () => {
    const product = { ...baseProduct, category: 'Bedroom' };
    render(<ProductCard product={product} />);

    expect(screen.getByText('Bedroom')).toBeInTheDocument();
  });
});
