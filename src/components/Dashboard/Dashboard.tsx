import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBudget } from '../../context/BudgetContext';
import { IncomeCard } from './IncomeCard';
import { SummaryCard } from './SummaryCard';
import { CategoryForm } from '../Categories/CategoryForm';
import { CategoryItem } from '../Categories/CategoryItem';

export const Dashboard: React.FC = () => {
  const { userData } = useAuth();
  const { summary, loading } = useBudget();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💰 Ваш бюджет
              </h1>
              <p className="mt-2 text-gray-600">
                Привет, {userData?.displayName || 'Пользователь'}! Управляйте своими финансами
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Месячный доход</p>
                <p className="text-xl font-bold text-green-600">
                  {userData?.monthlyIncome.toLocaleString()} ₽
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {userData?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Доход и статистика */}
        <div className="space-y-8 mb-8">
          <IncomeCard />
          <SummaryCard />
        </div>

        {/* Категории */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма добавления категории */}
          <div className="lg:col-span-1">
            <CategoryForm />
          </div>

          {/* Список категорий */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">📂 Категории расходов</h2>
                <div className="text-sm text-gray-500">
                  {summary?.byCategory.length || 0} категорий
                </div>
              </div>

              {summary?.byCategory && summary.byCategory.length > 0 ? (
                <div className="space-y-6">
                  {summary.byCategory.map((category) => (
                    <CategoryItem key={category.categoryId} category={category} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                  <div className="text-5xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Категорий пока нет
                  </h3>
                  <p className="text-gray-600">
                    Создайте свою первую категорию расходов
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};