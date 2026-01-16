import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src="https://thatworkx.com/wp-content/uploads/2025/08/thatworkx-logo-v1-21Apr2025-Logo-3.png"
              alt="Thatworkx Solutions" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div 
              className="hidden text-2xl font-bold text-primary-900"
              style={{ display: 'none' }}
            >
              Thatworkx
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-primary-700 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/audit-results" 
                  className="text-gray-700 hover:text-primary-700 font-medium transition-colors"
                >
                  Results
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-md transition-colors shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-700 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-orange-500 hover:bg-accent-orange-600 rounded-md transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
