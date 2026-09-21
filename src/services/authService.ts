import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export async function loginAdmin(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error: any) {
    // If user does not exist yet for default admin, attempt auto-creation for primary restaurant manager
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, pass);
        return newCred.user;
      } catch (createErr: any) {
        throw new Error(createErr.message || error.message || 'Authentication failed');
      }
    }
    throw new Error(error.message || 'Authentication failed');
  }
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
