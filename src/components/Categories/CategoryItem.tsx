import React, { useState } from 'react';
import { ExpenseForm } from './ExpenseForm';
import { useBudget } from '../../context/BudgetContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CategoryItemProps {
  category: {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    total: number;
    expenses: any[];
  };
}

export const CategoryItem: React.FC<CategoryItemProps> = ({ category }) => {
  const { deleteCategory, deleteExpense } = useBudget();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDeleteCategory = async () => {
    if (window.confirm(`Удалить категорию "${category.categoryName}" и все её расходы?`)) {
      await deleteCategory(category.categoryId);
    }
  };

  const handleDeleteExpense = async (expenseId: string, expenseName: string) => {
    if (window.confirm(`Удалить расход "${expenseName}"?`)) {
      await deleteExpense(expenseId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Заголовок категории */}
      <div
        className="p-6 text-white"
        style={{ backgroundColor: category.categoryColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{category.categoryIcon}</div>
            <div>
              <h3 className="text-xl font-bold">{category.categoryName}</h3>
              <p className="text-white/80">Всего: {category.total.toLocaleString()} ₽</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition backdrop-blur-sm"
              title={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition backdrop-blur-sm"
            >
              {showExpenseForm ? '✕ Отмена' : '➕ Добавить расход'}
            </button>
            <button
              onClick={handleDeleteCategory}
              className="bg-white/20 hover:bg-red-500/50 px-4 py-2 rounded-lg transition backdrop-blur-sm"
              title="Удалить категорию"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Форма добавления расхода */}
      {showExpenseForm && (
        <div className="p-6 border-b border-gray-100">
          <ExpenseForm
            categoryId={category.categoryId}
            onSuccess={() => setShowExpenseForm(false)}
          />
        </div>
      )}

      {/* Список расходов */}
      {isExpanded && (
        <div className="p-6">
          {category.expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              📭 Расходов пока нет
            </div>
          ) : (
            <div className="space-y-4">
              {category.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{expense.name}</div>
                      {expense.description && (
                        <span className="text-sm text-gray-500">
                          {expense.description}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {format(new Date(expense.date), 'dd MMMM yyyy', { locale: ru })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-red-600">
                      -{expense.amount.toLocaleString()} ₽
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id, expense.name)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Удалить расход"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
