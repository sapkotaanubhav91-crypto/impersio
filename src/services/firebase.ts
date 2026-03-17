import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export let isAuthAvailable = false;

// Initialize anonymous auth so user can save chats
// Handle the admin-restricted-operation error gracefully
export const initAuth = async () => {
  try {
    await signInAnonymously(auth);
    isAuthAvailable = true;
  } catch (err: any) {
    if (err.code === 'auth/admin-restricted-operation') {
      console.warn('Firebase Anonymous Auth is restricted in this project. Some features like saving chats may require signing in.');
    } else {
      console.error('Firebase Auth Error:', err);
    }
    isAuthAvailable = false;
  }
};

initAuth();
