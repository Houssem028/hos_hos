import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfHLGUVuqrzxc42BkO4ZAzbIxJSt7jZFw",
  authDomain: "hos-hos.firebaseapp.com",
  projectId: "hos-hos",
  storageBucket: "hos-hos.firebasestorage.app",
  messagingSenderId: "817137342563",
  appId: "1:817137342563:web:d714d48c46796cc4c34056"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

//
// 🚀 تسجيل حساب + حفظ بيانات المستخدم
//
export async function register(email, password, username){

  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  const user = userCred.user;

  // نخزن بيانات المستخدم في Firestore
  await setDoc(doc(db, "users", user.uid), {
    username: username,
    email: email,
    createdAt: new Date().toISOString()
  });

  return user;
}

//
// 🚀 تسجيل دخول
//
export function login(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

//
// 🚀 جلب بيانات المستخدم
//
export async function getUserData(uid){
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  } else {
    return {
      username: "بدون اسم"
    };
  }
}

//
// 🚀 مراقبة تسجيل الدخول
//
export function getUser(callback){
  onAuthStateChanged(auth, callback);
}
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
export const storage = getStorage(app);

// رفع صورة بروفايل
export async function uploadProfileImage(file, uid){

  const imageRef = ref(storage, `profiles/${uid}.jpg`);

  await uploadBytes(imageRef, file);

  const url = await getDownloadURL(imageRef);

  return url;
}
