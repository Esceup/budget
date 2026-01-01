import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const IncomeCard: React.FC = () => {
  const { userData, updateIncome } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [income, setIncome] = useState(userData?.monthlyIncome.toString() || '0');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newIncome = parseFloat(income);
    if (isNaN(newIncome) || newIncome < 0) {
      alert('Введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      await updateIncome(newIncome);
      setIsEditing(false);
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">📈 Ваш доход</h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              ₽
            </span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Введите сумму"
              autoFocus
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">📈 Ваш доход</h3>
          <p className="text-3xl font-bold mt-2">
            {userData?.monthlyIncome.toLocaleString()} ₽
          </p>
          <p className="text-blue-100 mt-1">в месяц</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition backdrop-blur-sm"
        >
          ✏️ Изменить
        </button>
      </div>
    </div>
  );
};