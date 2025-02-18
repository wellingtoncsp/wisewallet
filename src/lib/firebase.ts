import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6kQSxFrgeifhknPNp8ieSR3RkuxdX6gs",
  authDomain: "financas-297a4.firebaseapp.com",
  projectId: "financas-297a4",
  storageBucket: "financas-297a4.firebasestorage.app",
  messagingSenderId: "1094529404660",
  appId: "1:1094529404660:web:fa1102ec516d8d14cfd8a1",
  measurementId: "G-TT8GZPX9E1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);