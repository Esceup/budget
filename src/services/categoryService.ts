import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { type Category, type CategoryFormData } from '../types';

export class CategoryService {
  static async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, where('userId', '==', userId));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async addCategory(userId: string, data: CategoryFormData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        userId,
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  static async updateCategory(categoryId: string, data: Partial<CategoryFormData>) {
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, data);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(categoryId: string) {
    try {
      // Сначала удаляем все расходы этой категории
      const expenses = await this.getCategoryExpenses(categoryId);
      const deletePromises = expenses.map(expense => 
        ExpenseService.deleteExpense(expense.id)
      );
      await Promise.all(deletePromises);
      
      // Затем удаляем категорию
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  private static async getCategoryExpenses(categoryId: string) {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('categoryId', '==', categoryId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}