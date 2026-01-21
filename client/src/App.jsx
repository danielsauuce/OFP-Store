import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './views/Home';
import Shop from './views/Shop';
import About from './views/About';
import Contact from './views/Contact';
import AuthPage from './views/AuthPage';
import NotFound from './views/NotFound';
import AdminLayout from './views/admin/AdminLayout';
import { Toaster } from 'react-hot-toast';
import RouteGuard from './components/RouteGuard';
import { useAuth } from './context/authContext';

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
  console.log('🔍 Auth state in App:', auth);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primar mb-3y"></div>
        <div className="font-medium text-primary text-xl mt-2 ">Loading.....</div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: '#B87C4C',
            color: '#fff',
          },
          // styles for success message
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          // styles for error message
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />

      <Routes>
        {/* Auth Route - Redirects if already authenticatedd */}
        <Route
          path="/auth"
          element={
            <RouteGuard authenticated={auth.authenticate} user={auth.user} element={<AuthPage />} />
          }
        />

        {/* Admin Routes - Requires admin role */}
        <Route
          path="/admin/*"
          element={
            <RouteGuard
              authenticated={auth.authenticate}
              user={auth.user}
              element={<AdminLayout />}
              requireAuth={true}
              requireAdmin={true}
            />
          }
        />

        {/* Public Routes with Navbar/Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
