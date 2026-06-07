import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLq7xSjbp7S819LSBEnj1YX7osjTz2eGo",
  authDomain: "world-cup-2026-98e10.firebaseapp.com",
  projectId: "world-cup-2026-98e10",
  storageBucket: "world-cup-2026-98e10.firebasestorage.app",
  messagingSenderId: "664149926353",
  appId: "1:664149926353:web:fcc85d57dafa041da8c0f0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
