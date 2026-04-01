import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

export const navigations = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
];

const CommonSideBar = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-card border-r border-border">
        <div className="p-6">
          {/* Back to Store */}
          <Link
            to="/"
            className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-semibold">Back to Store</span>
          </Link>

          {/* Sidebar Title */}
          <h2 className="text-xl font-serif font-bold mb-6 text-foreground">Admin Panel</h2>

          {/* Navigation Links - FIX: These were defined but never rendered */}
          <nav className="space-y-1">
            {navigations.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Main Content — FIX: Use Outlet so nested admin routes render here */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CommonSideBar;
