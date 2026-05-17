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
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfHLGUVuqrzxc42BkO4ZAzbIxJSt7jZFw",
  authDomain: "hos-hos.firebaseapp.com",
  projectId: "hos-hos",
  storageBucket: "hos-hos.appspot.com",
  messagingSenderId: "817137342563",
  appId: "1:817137342563:web:d714d48c46796cc4c34056"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

//
// 🚀 إنشاء حساب
//
export async function register(email, password, username){

  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  await setDoc(doc(db, "users", user.uid), {
    username,
    email,
    image: "",
    followers: [],
    following: [],
    videos: 0,
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
// 🚀 جلب بيانات مستخدم
//
export async function getUserData(uid){
  const snap = await getDoc(doc(db, "users", uid));

  if(snap.exists()){
    return snap.data();
  }

  return null;
}

//
// 🚀 تحديث بيانات
//
export async function updateUser(uid, data){
  return updateDoc(doc(db, "users", uid), data);
}

//
// 🚀 متابعة
//
export async function followUser(myUid, targetUid){

  await updateDoc(doc(db, "users", myUid), {
    following: arrayUnion(targetUid)
  });

  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayUnion(myUid)
  });
}

//
// 🚀 إلغاء متابعة
//
export async function unfollowUser(myUid, targetUid){

  await updateDoc(doc(db, "users", myUid), {
    following: arrayRemove(targetUid)
  });

  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayRemove(myUid)
  });
}

//
// 🚀 البحث عن المستخدمين
//
export async function searchUsers(query){

  const snap = await getDocs(collection(db, "users"));

  let results = [];

  snap.forEach(docSnap => {

    const data = docSnap.data();

    if(data.username.toLowerCase().includes(query.toLowerCase())){
      results.push({
        id: docSnap.id,
        ...data
      });
    }

  });

  return results;
}

//
// 🚀 مراقبة المستخدم
//
export function getUser(callback){
  onAuthStateChanged(auth, callback);
}
