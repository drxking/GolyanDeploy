import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession } from '../api/client';

const navLinks = [
  { to: '/#about', label: 'About' },
  { to: '/#scholarships', label: 'Scholarships' },
  { to: '/eligibility', label: 'Eligibility' },
  { to: '/apply', label: 'Apply' },
  { to: '/#faq', label: 'FAQs' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pgs_user');
    return raw ? JSON.parse(raw) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    function syncUser() {
      const raw = localStorage.getItem('pgs_user');
      setUser(raw ? JSON.parse(raw) : null);
    }

    window.addEventListener('storage', syncUser);
    window.addEventListener('pgs-auth-change', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('pgs-auth-change', syncUser);
    };
  }, []);

  function logout() {
    clearSession();
    setMenuOpen(false);
    navigate('/');
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between  items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {/* <div className="w-8 h-8 bg-pg-maroon rounded-sm flex items-center justify-center">
              <span className="text-pg-gold font-black text-sm">PG</span>
            </div> */}
            <div>
              {/* <span className="text-xl font-extrabold text-pg-maroon leading-none">Seven</span>
              <span className="text-xl font-extrabold text-pg-gold leading-none">Petal</span> */}
              <img src="logo.png" alt="SevenPetal" className='h-16' />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className="text-gray-600 hover:text-pg-maroon px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-gray-50"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={dashboardPath} className="text-sm font-semibold text-gray-600 hover:text-pg-maroon transition-colors">
                  Dashboard
                </Link>
                <button type="button" onClick={logout} className="btn-primary text-sm px-5 py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-pg-maroon transition-colors">
                  Login
                </Link>
                <Link to="/apply" className="btn-primary text-sm px-5 py-2">
                  Apply Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-pg-maroon"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pg-maroon hover:bg-gray-50"
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pg-maroon hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button type="button" onClick={logout} className="block w-full mt-3 btn-primary text-center text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pg-maroon hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/apply"
                className="block mt-3 btn-primary text-center text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Apply Now
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
