import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation logic: Staff roles see different options than patients
  const isStaff = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'receptionist';

  // Helper to determine if a link is active for styling
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Shared Navbar Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        
        {/* Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">Hospital System</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                location.pathname === '/dashboard'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </Link>
            
            {/* Show Patient Database option only to Staff roles */}
            {isStaff && (
              <Link
                to="/patients"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive('/patients')
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Patients
              </Link>
            )}

            {/* Doctors directory accessible by everyone logged in */}
            <Link
              to="/doctors"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/doctors')
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctors
            </Link>

            {/* Appointments panel accessible by everyone logged in */}
            <Link
              to="/appointments"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/appointments')
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Appointments
            </Link>

            {/* Medical Records panel accessible by everyone logged in */}
            <Link
              to="/medical-records"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/medical-records')
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medical History
            </Link>

            {/* Billing panel accessible by everyone logged in */}
            <Link
              to="/billing"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/billing')
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Billing
            </Link>

            {/* Reports and Analytics visible strictly to Admin */}
            {user?.role === 'admin' && (
              <Link
                to="/reports"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive('/reports')
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reports
              </Link>
            )}
          </nav>
        </div>

        {/* User Profile & Hamburger Action */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="hidden sm:block py-2 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-sm font-medium rounded-xl transition duration-150 border border-slate-700/50"
          >
            Sign Out
          </button>

          {/* Hamburger Mobile Toggle Menu Icon */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 lg:hidden rounded-xl bg-slate-800 hover:bg-slate-750 transition border border-slate-700/40 focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

      </header>

      {/* Mobile Menu Dropdown Panel */}
      {isMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col gap-2.5 shadow-inner transition duration-150 animate-in slide-in-from-top-4">
          <div className="pb-3 border-b border-slate-800 mb-2 flex items-center justify-between sm:hidden">
            <div>
              <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => { setIsMenuOpen(false); logout(); }}
              className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg transition"
            >
              Sign Out
            </button>
          </div>

          <Link
            to="/dashboard"
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Dashboard
          </Link>

          {isStaff && (
            <Link
              to="/patients"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/patients') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              Patients
            </Link>
          )}

          <Link
            to="/doctors"
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/doctors') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Doctors
          </Link>

          <Link
            to="/appointments"
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/appointments') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Appointments
          </Link>

          <Link
            to="/medical-records"
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/medical-records') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Medical History
          </Link>

          <Link
            to="/billing"
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/billing') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Billing
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/reports"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/reports') ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              Reports
            </Link>
          )}
        </div>
      )}

      {/* Main viewport where active page is loaded */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
