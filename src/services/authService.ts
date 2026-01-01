import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { type RegisterFormData } from '../types';

export class AuthService {
  static async register(data: RegisterFormData) {
    try {
      // Создаем пользователя
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Обновляем профиль
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      // Создаем документ пользователя в Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        displayName: data.name,
        monthlyIncome: data.monthlyIncome || 0,
        currency: '₽',
        createdAt: serverTimestamp(),
      });

      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async updateUserIncome(uid: string, monthlyIncome: number) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { monthlyIncome }, { merge: true });
    } catch (error) {
      console.error('Update income error:', error);
      throw error;
    }
  }
}