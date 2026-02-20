import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './views/Home';
import Shop from './views/Shop';
import ProductDetails from './views/ProductDetails';
import About from './views/About';
import Contact from './views/Contact';
import Cart from './views/Cart';
import Checkout from './views/CheckOutPage';
import Profile from './views/Profile';
import AuthPage from './views/AuthPage';
import NotFound from './views/NotFound';
import { Toaster } from 'react-hot-toast';
import RouteGuard from './components/RouteGuard';
import { useAuth } from './context/authContext';
import CommonSideBar from './views/admin/components/CommonSideBar';

// Layout component for pages with Navbar & Footer
const MainLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

function App() {
  const { auth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-3"></div>
        <div className="font-medium text-primary text-xl mt-2">Loading.....</div>
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
        {/* Auth Route */}
        <Route
          path="/auth"
          element={
            <RouteGuard authenticated={auth.authenticate} user={auth.user} element={<AuthPage />} />
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <RouteGuard
              authenticated={auth.authenticate}
              user={auth.user}
              element={<CommonSideBar />}
              requireAuth={true}
              requireAdmin={true}
            />
          }
        />

        {/* Public Routes with Navbar and Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <RouteGuard
                authenticated={auth.authenticate}
                user={auth.user}
                element={<Checkout />}
                requireAuth={true}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <RouteGuard
                authenticated={auth.authenticate}
                user={auth.user}
                element={<Profile />}
                requireAuth={true}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
