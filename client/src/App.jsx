import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import RouteGuard from './components/RouteGuard';
import { useAuth } from './context/authContext';
import { SocketProvider } from './context/socketContext';
import { NotificationProvider } from './context/notificationContext';
import MainLayout from './components/mainLayout';
import NotFound from './views/NotFound';

// public pages
const Home = lazy(() => import('./views/Home'));
const Shop = lazy(() => import('./views/Shop'));
const About = lazy(() => import('./views/About'));
const Contact = lazy(() => import('./views/Contact'));
const AuthPage = lazy(() => import('./views/AuthPage'));
const Cart = lazy(() => import('./views/Cart'));
const Profile = lazy(() => import('./views/Profile'));
const ProductDetails = lazy(() => import('./views/ProductDetails'));
const Checkout = lazy(() => import('./views/CheckOutPage'));
const Notifications = lazy(() => import('./views/Notifications'));

// admin pages
const CommonSideBar = lazy(() => import('./views/admin/components/CommonSideBar'));
const Dashboard = lazy(() => import('./views/admin/Dashboard'));
const Products = lazy(() => import('./views/admin/Products'));
const Orders = lazy(() => import('./views/admin/Orders'));
const Users = lazy(() => import('./views/admin/Users'));
const Analytics = lazy(() => import('./views/admin/Analytics'));
const AdminChat = lazy(() => import('./views/admin/Chat'));
const AdminNotifications = lazy(() => import('./views/admin/Notifications'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  const { auth, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <SocketProvider>
      <NotificationProvider>
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

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth */}
            <Route
              path="/auth"
              element={
                <RouteGuard
                  authenticated={auth.authenticate}
                  user={auth.user}
                  element={<AuthPage />}
                />
              }
            />

            {/* Admin — lazy-loaded, only admins ever reach this subtree */}
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
              <Route path="chat" element={<AdminChat />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            {/* Public pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;
