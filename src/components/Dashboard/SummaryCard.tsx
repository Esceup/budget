import React from 'react';
import { useBudget } from '../../context/BudgetContext';

export const SummaryCard: React.FC = () => {
  const { summary } = useBudget();

  if (!summary) return null;

  const percentage = summary.monthlyIncome > 0 
    ? (summary.totalExpenses / summary.monthlyIncome) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Расходы</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              -{summary.totalExpenses.toLocaleString()} ₽
            </p>
          </div>
          <div className="text-3xl">📉</div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {percentage.toFixed(1)}% от дохода
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Остаток</p>
            <p className={`text-3xl font-bold mt-2 ${
              summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()} ₽
            </p>
          </div>
          <div className="text-3xl">💰</div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          {summary.balance >= 0 ? 'У вас осталось' : 'Вы перерасходовали'}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Категорий</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {summary.byCategory.length}
            </p>
          </div>
          <div className="text-3xl">🗂️</div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Всего расходов: {summary.byCategory.reduce((acc, cat) => acc + cat.expenses.length, 0)}
        </p>
      </div>
    </div>
  );
};