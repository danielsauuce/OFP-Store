import { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, UserCircle, Users, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';
import { useAuth } from '../context/authContext';
import gsap from 'gsap';

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

  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const logoRef = useRef(null);
  const themeIconRef = useRef(null);
  const hasAnimated = useRef(false);

  // Desktop nav entrance runs once on mount
  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      // Logo slides in
      gsap.from(logoRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      });

      // Nav links stagger in
      const links = gsap.utils.toArray('.nav-desktop-link');
      gsap.from(links, {
        y: -15,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: 'power2.out',
      });

      // Action icons fade in
      const icons = gsap.utils.toArray('.nav-action-icon');
      gsap.from(icons, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        delay: 0.5,
        ease: 'back.out(2)',
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // Animate mobile menu open/close
  useLayoutEffect(() => {
    if (!mobileMenuRef.current) return;

    if (open) {
      const ctx = gsap.context(() => {
        // Menu container slides down
        gsap.fromTo(
          mobileMenuRef.current,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power3.out' },
        );

        // Menu items stagger in
        const items = gsap.utils.toArray('.mobile-nav-item');
        gsap.from(items, {
          x: -30,
          opacity: 0,
          duration: 0.35,
          stagger: 0.05,
          delay: 0.15,
          ease: 'power2.out',
        });
      }, mobileMenuRef);

      return () => ctx.revert();
    }
  }, [open]);

  // Animate theme icon rotation on toggle
  const handleThemeToggle = useCallback(() => {
    if (themeIconRef.current) {
      gsap.fromTo(
        themeIconRef.current,
        { rotate: -90, scale: 0.5 },
        { rotate: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' },
      );
    }
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const handleLogout = async () => {
    const data = await signOut();

    if (data?.success) {
      navigate('/');
      setOpen(false);
    }
  };

  return (
    <nav
      ref={navRef}
      className="bg-card/95 w-full p-4 sticky top-0 z-50 shadow backdrop-blur supports-[backdrop-filter]:bg-card/60"
    >
      <div className="flex justify-between pl-5 pr-3 items-center">
        {/* Logo */}
        <Link to="/" ref={logoRef}>
          <h2 className="text-xl font-bold font-serif text-primary">Olayinka Furniture Palace</h2>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex flex-row space-x-10 text-foreground items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `nav-desktop-link relative transition-colors duration-200 hover:text-primary ${isActive ? 'text-primary font-semibold' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] w-full bg-primary transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* Cart Icon */}
          <Link to="/cart" className="nav-action-icon hover:text-primary transition-colors">
            <ShoppingCart size={18} />
          </Link>

          {/* Authenticated: Profile + Logout | Not authenticated: Login */}
          {auth.authenticate ? (
            <>
              <Link
                to="/profile"
                className="nav-action-icon hover:text-primary transition-colors"
                title="My Profile"
              >
                <UserCircle size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="nav-action-icon hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/auth" className="nav-action-icon hover:text-primary transition-colors">
              <Users size={18} />
            </Link>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={handleThemeToggle}
            className="nav-action-icon hover:text-primary transition-colors"
          >
            <span ref={themeIconRef} className="inline-block">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
        </div>

        {/* Mobile Hamburger + Cart */}
        <div className="flex md:hidden items-center space-x-8 text-foreground">
          <Link to="/cart">
            <ShoppingCart size={20} />
          </Link>

          <button onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          ref={mobileMenuRef}
          className="md:hidden mt-4 flex flex-col space-y-4 text-foreground bg-card p-4 rounded-2xl shadow border border-border overflow-hidden"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `mobile-nav-item transition-colors ${isActive ? 'text-primary font-semibold' : 'text-black/60'}`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mobile-nav-item flex flex-col space-y-3 pt-2 border-t border-border">
            {auth.authenticate ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Logged in as:{' '}
                  <span className="font-medium text-foreground">{auth.user?.fullName}</span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <UserCircle size={18} />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 hover:text-destructive transition-colors"
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
            className="mobile-nav-item pt-2 flex items-center border-t border-border hover:text-primary transition-colors"
            onClick={() => {
              handleThemeToggle();
              setOpen(false);
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
