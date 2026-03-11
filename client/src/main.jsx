import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/authContext.jsx';
import { CartProvider } from './context/cartContext.jsx';
import { WishlistProvider } from './context/wishlistContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>,
);
