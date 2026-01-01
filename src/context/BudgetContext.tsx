import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BudgetService } from '../services/budgetService';
import { CategoryService } from '../services/categoryService';
import { ExpenseService } from '../services/expenseService';
import { useAuth } from './AuthContext';
import { type BudgetSummary, type Category, type Expense } from '../types';

interface BudgetContextType {
  summary: BudgetSummary | null;
  categories: Category[];
  loading: boolean;
  refreshSummary: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategory: (data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addExpense: (categoryId: string, data: any) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within BudgetProvider');
  }
  return context;
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshSummary = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const data = await BudgetService.getBudgetSummary(currentUser.uid);
      setSummary(data);
    } catch (error) {
      console.error('Error refreshing summary:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const refreshCategories = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const data = await CategoryService.getUserCategories(currentUser.uid);
      setCategories(data);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  }, [currentUser]);

  const addCategory = async (data: any) => {
    if (!currentUser) return;
    
    try {
      await CategoryService.addCategory(currentUser.uid, data);
      await refreshCategories();
      await refreshSummary();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await CategoryService.deleteCategory(id);
      await refreshCategories();
      await refreshSummary();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addExpense = async (categoryId: string, data: any) => {
    if (!currentUser) return;
    
    try {
      await ExpenseService.addExpense(currentUser.uid, categoryId, data);
      await refreshSummary();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await ExpenseService.deleteExpense(expenseId);
      await refreshSummary();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshSummary();
      refreshCategories();
    }
  }, [currentUser, refreshSummary, refreshCategories]);

  const value = {
    summary,
    categories,
    loading,
    refreshSummary,
    refreshCategories,
    addCategory,
    deleteCategory,
    addExpense,
    deleteExpense,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};