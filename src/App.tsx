import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';

// Иконки для редактирования и удаления
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg className="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isExpanded ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    )}
  </svg>
);

function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [income, setIncome] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Для каждой категории свой набор полей для добавления расхода
  const [expenseInputs, setExpenseInputs] = useState<Record<string, {name: string, amount: string}>>({});
  // Скрытые/развернутые категории
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  // Редактирование категорий и расходов
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  // Выделенные расходы (подкатегории)
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  // Загружаем доход пользователя при авторизации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserIncome(user.uid);
        loadCategories(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Загружаем доход пользователя
  const loadUserIncome = async (userId: string) => {
    try {
      const usersQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        setIncome(userData.monthlyIncome || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки дохода:', error);
    }
  };

  // Обработчик клика на подкатегорию (расход)
  const handleExpenseClick = (expenseId: string, e: React.MouseEvent) => {
    // Предотвращаем всплытие события, чтобы не срабатывали клики на редактирование/удаление
    e.stopPropagation();
    
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId); // Снимаем выделение
      } else {
        newSet.add(expenseId); // Добавляем выделение
      }
      return newSet;
    });
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert('Ошибка входа. Проверьте email и пароль.');
    }
  };

  const register = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Обновляем имя пользователя
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Создаем документ пользователя в Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: email,
        displayName: name,
        monthlyIncome: 0,
        currency: '₽',
        createdAt: serverTimestamp()
      });
      
    } catch (error: any) {
      alert(`Ошибка регистрации: ${error.message}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addCategory = async (categoryName: string) => {
    if (!user || !categoryName.trim()) {
      alert('Введите название категории');
      return;
    }
    
    try {
      await addDoc(collection(db, 'categories'), {
        userId: user.uid,
        name: categoryName.trim(),
        createdAt: serverTimestamp()
      });
      loadCategories(user.uid);
    } catch (error) {
      alert('Ошибка создания категории');
    }
  };

  const loadCategories = async (userId: string) => {
    try {
      // Загружаем категории
      const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Для каждой категории загружаем расходы
      const categoriesWithExpenses = await Promise.all(
        categoriesData.map(async (category) => {
          const expensesQuery = query(
            collection(db, 'expenses'), 
            where('categoryId', '==', category.id)
          );
          const expensesSnapshot = await getDocs(expensesQuery);
          const expenses = expensesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          return {
            ...category,
            expenses
          };
        })
      );

      setCategories(categoriesWithExpenses);
      
      // Инициализируем поля ввода для каждой категории
      const initialInputs: Record<string, {name: string, amount: string}> = {};
      const initialExpanded: Record<string, boolean> = {};
      categoriesWithExpenses.forEach(cat => {
        initialInputs[cat.id] = { name: '', amount: '' };
        initialExpanded[cat.id] = true; // По умолчанию все категории развернуты
      });
      setExpenseInputs(initialInputs);
      setExpandedCategories(initialExpanded);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const startEditCategory = (categoryId: string, currentName: string) => {
    setEditingCategory(categoryId);
    setEditCategoryName(currentName);
  };

  const saveCategory = async (categoryId: string) => {
    if (!editCategoryName.trim()) {
      alert('Введите название категории');
      return;
    }

    try {
      await updateDoc(doc(db, 'categories', categoryId), {
        name: editCategoryName.trim()
      });
      setEditingCategory(null);
      loadCategories(user.uid);
    } catch (error) {
      alert('Ошибка обновления категории');
    }
  };

  const startEditExpense = (expenseId: string, currentName: string, currentAmount: number) => {
    setEditingExpense(expenseId);
    setEditExpenseName(currentName);
    setEditExpenseAmount(currentAmount.toString());
  };

  const saveExpense = async (expenseId: string) => {
    if (!editExpenseName.trim() || !editExpenseAmount) {
      alert('Заполните название и сумму');
      return;
    }

    const amount = parseFloat(editExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        name: editExpenseName.trim(),
        amount: amount
      });
      setEditingExpense(null);
      loadCategories(user.uid);
    } catch (error) {
      alert('Ошибка обновления расхода');
    }
  };

  const addExpense = async (categoryId: string) => {
    if (!user) return;
    
    const inputs = expenseInputs[categoryId];
    if (!inputs || !inputs.name.trim() || !inputs.amount) {
      alert('Заполните название и сумму расхода');
      return;
    }

    const amount = parseFloat(inputs.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    try {
      await addDoc(collection(db, 'expenses'), {
        userId: user.uid,
        categoryId: categoryId,
        name: inputs.name.trim(),
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      // Очищаем поля ввода для этой категории
      setExpenseInputs(prev => ({
        ...prev,
        [categoryId]: { name: '', amount: '' }
      }));

      // Перезагружаем данные
      loadCategories(user.uid);
      
    } catch (error) {
      alert('Ошибка добавления расхода');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm('Удалить категорию и все её расходы?')) {
      try {
        // Удаляем категорию
        await deleteDoc(doc(db, 'categories', categoryId));
        
        // Удаляем все расходы этой категории
        const expensesQuery = query(collection(db, 'expenses'), where('categoryId', '==', categoryId));
        const expensesSnapshot = await getDocs(expensesQuery);
        
        const deletePromises = expensesSnapshot.docs.map(expenseDoc => 
          deleteDoc(doc(db, 'expenses', expenseDoc.id))
        );
        await Promise.all(deletePromises);
        
        loadCategories(user.uid);
      } catch (error) {
        alert('Ошибка удаления категории');
      }
    }
  };

  const deleteExpense = async (expenseId: string, expenseName: string) => {
    if (window.confirm(`Удалить расход "${expenseName}"?`)) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        loadCategories(user.uid);
      } catch (error) {
        alert('Ошибка удаления расхода');
      }
    }
  };

  const updateIncome = async () => {
    if (!user) return;
    
    try {
      // Находим документ пользователя
      const usersQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          monthlyIncome: income
        });
      } else {
        // Создаем документ если его нет
        await addDoc(collection(db, 'users'), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          monthlyIncome: income,
          currency: '₽',
          createdAt: serverTimestamp()
        });
      }
      
      alert('Доход обновлен!');
    } catch (error) {
      console.error('Ошибка обновления дохода:', error);
      alert('Ошибка обновления дохода');
    }
  };

  // Подсчет общей суммы расходов
  const totalExpenses = categories.reduce((total, category) => {
    const categoryTotal = category.expenses?.reduce((sum: number, expense: any) => 
      sum + (expense.amount || 0), 0) || 0;
    return total + categoryTotal;
  }, 0);

  // Обновление поля ввода для конкретной категории
  const updateExpenseInput = (categoryId: string, field: 'name' | 'amount', value: string) => {
    setExpenseInputs(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value
      }
    }));
  };

  // Если пользователь не авторизован, показываем форму входа/регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">📊</div>
            <h1 className="text-2xl font-semibold text-gray-900">Учет расходов</h1>
            <p className="text-gray-600 mt-2 text-sm">
              {isRegistering ? 'Создайте новый аккаунт' : 'Войдите в свой аккаунт'}
            </p>
          </div>

          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ваше имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="Иван Иванов"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="••••••••"
              />
              {isRegistering && (
                <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
              )}
            </div>

            <button
              onClick={isRegistering ? register : login}
              className="w-full bg-gray-900 text-white py-2.5 rounded font-medium hover:bg-gray-800 transition text-sm"
            >
              {isRegistering ? 'Зарегистрироваться' : 'Войти'}
            </button>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition"
            >
              {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Основной интерфейс для авторизованного пользователя
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
                onClick={logout}
                className="absolute right-5 top-5 bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 transition"
              >
                Выйти
              </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">📊 Учет расходов</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="">
                <p className="text-sm text-gray-600">Доход в месяц</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="0"
                  />
                  <button
                    onClick={updateIncome}
                    className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 transition"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
              
              
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Доход</p>
                <p className="text-2xl font-semibold text-gray-900">{income.toLocaleString()} ₽</p>
              </div>
              <div className="text-xl">📈</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Расходы</p>
                <p className="text-2xl font-semibold text-gray-900">{totalExpenses.toLocaleString()} ₽</p>
              </div>
              <div className="text-xl">📉</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Остаток</p>
                <p className={`text-2xl font-semibold ${
                  income - totalExpenses >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}>
                  {(income - totalExpenses).toLocaleString()} ₽
                </p>
              </div>
              <div className="text-xl">💰</div>
            </div>
          </div>
        </div>

        {/* Добавление категории */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Добавить категорию</h2>
          <CategoryForm onAddCategory={addCategory} />
        </div>

        {/* Список категорий */}
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryTotal = category.expenses?.reduce((sum: number, expense: any) => 
              sum + (expense.amount || 0), 0) || 0;
            const isExpanded = expandedCategories[category.id] || false;

            return (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Заголовок категории */}
                <div className="border-b border-gray-100">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="text-gray-500 hover:text-gray-700 transition"
                        >
                          <ExpandIcon isExpanded={isExpanded} />
                        </button>
                        
                        {editingCategory === category.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                              autoFocus
                            />
                            <button
                              onClick={() => saveCategory(category.id)}
                              className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                            <button
                              onClick={() => startEditCategory(category.id, category.name)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title="Редактировать категорию"
                            >
                              <EditIcon />
                            </button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-gray-900">
                          {categoryTotal.toLocaleString()} ₽
                        </span>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Удалить категорию"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Содержимое категории (скрывается/показывается) */}
                {isExpanded && (
                  <div className="p-4">
                    {/* Форма добавления расхода */}
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={expenseInputs[category.id]?.name || ''}
                          onChange={(e) => updateExpenseInput(category.id, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          placeholder="Название расхода"
                        />
                        <input
                          type="number"
                          value={expenseInputs[category.id]?.amount || ''}
                          onChange={(e) => updateExpenseInput(category.id, 'amount', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          placeholder="Сумма"
                        />
                        <button
                          onClick={() => addExpense(category.id)}
                          className="bg-gray-900 text-white py-2 rounded text-sm hover:bg-gray-800 transition"
                        >
                          Добавить расход
                        </button>
                      </div>
                    </div>

                    {/* Список расходов */}
                    <div>
                      {category.expenses?.length > 0 ? (
                        <div className="space-y-2">
                          {category.expenses.map((expense: any) => (
                            <div 
                              key={expense.id}
                              onClick={(e) => handleExpenseClick(expense.id, e)}
                              className={`flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition cursor-pointer ${
                                selectedExpenses.has(expense.id) ? 'bg-green-50 border-green-200' : ''
                              }`}
                            >
                              <div className="flex-1">
                                {editingExpense === expense.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editExpenseName}
                                      onChange={(e) => setEditExpenseName(e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-32"
                                      autoFocus
                                    />
                                    <input
                                      type="number"
                                      value={editExpenseAmount}
                                      onChange={(e) => setEditExpenseAmount(e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-24"
                                    />
                                    <button
                                      onClick={() => saveExpense(expense.id)}
                                      className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingExpense(null)}
                                      className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{expense.name}</span>
                                    <button
                                      onClick={() => startEditExpense(expense.id, expense.name, expense.amount)}
                                      className="text-gray-400 hover:text-gray-600 text-xs"
                                      title="Редактировать"
                                    >
                                      <EditIcon />
                                    </button>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(expense.date).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {expense.amount?.toLocaleString()} ₽
                                </span>
                                <button
                                  onClick={() => deleteExpense(expense.id, expense.name)}
                                  className="text-gray-400 hover:text-red-500 transition"
                                  title="Удалить расход"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Расходов пока нет
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 text-gray-300">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Категорий пока нет
            </h3>
            <p className="text-gray-600 text-sm">
              Создайте свою первую категорию расходов
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Компонент формы добавления категории
const CategoryForm: React.FC<{ onAddCategory: (name: string) => void }> = ({ onAddCategory }) => {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onAddCategory(categoryName);
      setCategoryName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        placeholder="Название категории"
      />
      <button
        type="submit"
        className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition"
      >
        Добавить
      </button>
    </form>
  );
};

export default App;