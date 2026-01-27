import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';

export const navigations = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

const CommonSideBar = ({ children }) => {
  const location = useLocation();
  const navigation = navigations;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-card border-r border-primary ">
        <div className="p-6">
          {/* Back to Store */}
          <Link
            to="/"
            className="flex items-center gap-2 mb-8 hover:text-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-semibold">Back to Store</span>
          </Link>

          {/* Sidebar Title */}
          <h2 className="text-xl font-serif font-bold mb-6">Admin Panel</h2>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default CommonSideBar;
