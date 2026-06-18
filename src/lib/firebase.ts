import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRU-_BfJFFX8qtyo31aimtiPkF52Qq5IY",
  authDomain: "eland-499006.firebaseapp.com",
  projectId: "eland-499006",
  storageBucket: "eland-499006.firebasestorage.app",
  messagingSenderId: "274252448258",
  appId: "1:274252448258:web:01c07f9f0b96b5dd599d1b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, 'ai-studio-cbc74e7b-a5e2-4534-aa24-aac3ff4881b3');
