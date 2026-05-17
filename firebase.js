import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase config (اللي أعطاك إياه)
const firebaseConfig = {
  apiKey: "AIzaSyBfHLGUVuqrzxc42BkO4ZAzbIxJSt7jZFw",
  authDomain: "hos-hos.firebaseapp.com",
  projectId: "hos-hos",
  storageBucket: "hos-hos.firebasestorage.app",
  messagingSenderId: "817137342563",
  appId: "1:817137342563:web:d714d48c46796cc4c34056",
  measurementId: "G-68ZHGH269G"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// تسجيل حساب
export function register(email, password){
  return createUserWithEmailAndPassword(auth, email, password);
}

// تسجيل دخول
export function login(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}
