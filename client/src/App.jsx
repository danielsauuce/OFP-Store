import { Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Shop from './views/Shop';
import About from './views/About';
import Contact from './views/Contact';
import AuthPage from './views/AuthPage';
import Cart from './views/Cart';
import NotFound from './views/NotFound';
import Profile from './views/Profile';
import { Toaster } from 'react-hot-toast';
import RouteGuard from './components/RouteGuard';
import { useAuth } from './context/authContext';
import CommonSideBar from './views/admin/components/CommonSideBar';
import Dashboard from './views/admin/Dashboard';
import Products from './views/admin/Products';
import Orders from './views/admin/Orders';
import Users from './views/admin/Users';
import Analytics from './views/admin/Analytics';
import { Loader } from 'lucide-react';
import MainLayout from './components/mainLayout';
import Checkout from './views/CheckOutPage';

function App() {
  const { auth, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(0 0% 100%)',
            color: 'hsl(25 30% 15%)',
            border: '1px solid hsl(40 20% 85%)',
            borderRadius: '0.375rem',
            padding: '1rem 1.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontSize: '0.875rem',
          },

          success: {
            iconTheme: {
              primary: 'hsl(150 30% 40%)',
              secondary: 'hsl(0 0% 100%)',
            },
          },

          error: {
            style: {
              background: 'hsl(0 72% 51%)',
              color: 'hsl(0 0% 100%)',
              border: '1px solid hsl(0 72% 51%)',
            },
          },
          duration: 4000,
        }}
      />

      <Routes>
        {/* Auth Route - Redirects if already authenticated */}
        <Route
          path="/auth"
          element={
            <RouteGuard authenticated={auth.authenticate} user={auth.user} element={<AuthPage />} />
          }
        />

        {/* Admin Routes - Requires admin role */}
        <Route
          path="/admin"
          element={
            <RouteGuard
              authenticated={auth.authenticate}
              user={auth.user}
              element={<CommonSideBar />}
              requireAuth={true}
              requireAdmin={true}
            />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Public Routes with Navbar/Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
                <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
