import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <span className="text-3xl">💰</span>
              <div>
                <span className="font-bold text-xl">BudgetSimple</span>
                <div className="text-xs text-gray-300">Упрощенный учет финансов</div>
              </div>
            </Link>
          </div>

          {currentUser ? (
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-300">Баланс</p>
                <p className="font-bold">
                  {userData?.monthlyIncome?.toLocaleString() || 0} ₽
                </p>
              </div>
              <div className="flex items-center space-x-4 pl-6 border-l border-gray-700">
                <span className="text-gray-300">
                  👤 {userData?.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Регистрация
              </Link>
            </div>
          )}

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4">
          {currentUser ? (
            <>
              <div className="py-4 border-b border-gray-700">
                <p className="text-gray-300">👤 {userData?.displayName || currentUser.email}</p>
                <p className="font-bold mt-1">
                  Баланс: {userData?.monthlyIncome?.toLocaleString() || 0} ₽
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <div className="space-y-3 py-4">
              <Link
                to="/login"
                className="block text-center text-gray-300 hover:text-white py-2 rounded-md font-medium transition"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="block text-center bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};