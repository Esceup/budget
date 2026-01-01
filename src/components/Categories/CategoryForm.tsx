import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Синий' },
  { value: '#10B981', label: 'Зеленый' },
  { value: '#EF4444', label: 'Красный' },
  { value: '#F59E0B', label: 'Оранжевый' },
  { value: '#8B5CF6', label: 'Фиолетовый' },
  { value: '#EC4899', label: 'Розовый' },
  { value: '#6366F1', label: 'Индиго' },
  { value: '#14B8A6', label: 'Бирюзовый' },
];

const ICON_OPTIONS = [
  { value: '🏠', label: 'Дом' },
  { value: '🚗', label: 'Машина' },
  { value: '🛒', label: 'Продукты' },
  { value: '🏥', label: 'Здоровье' },
  { value: '🎓', label: 'Образование' },
  { value: '🎬', label: 'Развлечения' },
  { value: '👕', label: 'Одежда' },
  { value: '🍽️', label: 'Еда вне дома' },
  { value: '✈️', label: 'Путешествия' },
  { value: '💻', label: 'Техника' },
];

export const CategoryForm: React.FC = () => {
  const { addCategory } = useBudget();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Введите название категории');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addCategory({ name, color, icon });
      setName('');
      setColor(COLOR_OPTIONS[0].value);
      setIcon(ICON_OPTIONS[0].value);
    } catch (err: any) {
      setError('Ошибка при создании категории');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Добавить категорию</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название категории
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Например: Квартира, Транспорт, Развлечения"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет категории
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`w-10 h-10 rounded-full border-2 transition ${
                    color === option.value ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIcon(option.value)}
                  className={`text-2xl w-12 h-12 flex items-center justify-center rounded-lg border-2 transition ${
                    icon === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={option.label}
                >
                  {option.value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <div>
                <p className="font-medium">{name || 'Новая категория'}</p>
                <p className="text-sm text-gray-500">Предпросмотр</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};