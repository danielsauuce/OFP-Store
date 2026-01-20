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
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Routes without Navbar/Footer */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminLayout />} />

        {/* Routes with Navbar/Footer */}
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
