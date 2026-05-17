import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// AUTH
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// FIRESTORE
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// STORAGE
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfHLGUVuqrzxc42BkO4ZAzbIxJSt7jZFw",
  authDomain: "hos-hos.firebaseapp.com",
  projectId: "hos-hos",
  storageBucket: "hos-hos.firebasestorage.app",
  messagingSenderId: "817137342563",
  appId: "1:817137342563:web:d714d48c46796cc4c34056"
};

// init
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

//
// 🚀 تسجيل حساب + حفظ بيانات المستخدم
//
export async function register(email, password, username){

  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  await setDoc(doc(db, "users", user.uid), {
    username: username,
    email: email,
    image: "",
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

  const refDoc = doc(db, "users", uid);
  const snap = await getDoc(refDoc);

  if(snap.exists()){
    return snap.data();
  }

  return {
    username: "بدون اسم",
    image: ""
  };
}

//
// 🚀 تحديث بيانات المستخدم
//
export async function updateUser(uid, data){
  const refDoc = doc(db, "users", uid);
  return updateDoc(refDoc, data);
}

//
// 🚀 مراقبة تسجيل الدخول
//
export function getUser(callback){
  onAuthStateChanged(auth, callback);
}

//
// 🚀 رفع صورة بروفايل
//
export async function uploadProfileImage(file, uid){

  const imageRef = ref(storage, `profiles/${uid}.jpg`);

  await uploadBytes(imageRef, file);

  const url = await getDownloadURL(imageRef);

  return url;
}
