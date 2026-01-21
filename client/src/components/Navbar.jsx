import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, Users, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useDarkMode();
  const { auth, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const data = await signOut();

    if (data?.success) {
      navigate('/');
      setOpen(false);
    }
  };

  return (
    <nav className="bg-card/95 w-full p-4 sticky top-0 z-50 shadow backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex justify-between pl-5 pr-3 items-center">
        {/* Logo */}
        <Link to="/">
          <h2 className="text-xl font-bold font-serif text-[#815331]">Olayinka Furniture Palace</h2>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex flex-row space-x-10 text-[#815331] items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `relative transition-colors duration-200 hover:text-primary ${isActive ? 'text-primary font-semibold' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {' '}
                  {item.label}{' '}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] w-full bg-primary transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* Cart Icon */}
          <Link to="/cart">
            <ShoppingCart size={18} />
          </Link>

          {/* Auth/Profile Icon or Logout */}
          {auth.authenticate ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <Link to="/auth">
              <Users size={18} />
            </Link>
          )}

          {/* Dark Mode Toggle */}
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile Hamburger + Cart */}
        <div className="flex md:hidden items-center space-x-8 text-[#815331]">
          {/* Cart Icon */}
          <Link to="/cart">
            <ShoppingCart size={20} />
          </Link>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-4 flex flex-col space-y-4 text-[#815331] dark:text-[#e8d9c3] bg-[#faf8f5] dark:bg-[#1a1a1a] p-4 rounded-lg shadow">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `transition-colors ${isActive ? 'text-primary font-semibold' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="flex flex-col space-y-3 pt-2 border-t border-border">
            {/* Logout in Mobile */}
            {auth.authenticate ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Logged in as: <span className="font-medium">{auth.user?.fullName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Users size={18} />
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>

          <button
            className="pt-2 flex items-center border-t border-border"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'dark' ? (
              <Sun size={22} className="h-5 w-5 rotate-0 scale-100 transition-all" />
            ) : (
              <Moon size={22} className="h-5 w-5 rotate-0 scale-100 transition-all" />
            )}
            <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
