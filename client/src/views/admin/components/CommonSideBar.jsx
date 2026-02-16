import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { Home, LayoutDashboard, Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';

import Dashboard from '../Dashboard';
import Products from '../Products';
import Orders from '../Orders';
import UsersPage from '../Users';
import Analytics from '../Analytics';

export const navigations = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

const CommonSideBar = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-card border-r border-primary">
        <div className="p-6">
          <Link
            to="/"
            className="flex items-center gap-2 mb-8 hover:text-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-semibold">Back to Store</span>
          </Link>

          <h2 className="text-xl font-serif font-bold mb-6">Admin Panel</h2>

          <nav className="space-y-5">
            {navigations.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
};

export default CommonSideBar;
