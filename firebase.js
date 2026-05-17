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
  updateDoc,
  collection,
  getDocs,
  increment
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

// init
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

//
// 🚀 تسجيل حساب
//
export async function register(email, password, username){

  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  await setDoc(doc(db, "users", user.uid), {
    username,
    email,
    image: "",
    followers: 0,
    following: 0,
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
    image: "",
    followers: 0,
    following: 0,
    videos: 0
  };
}

//
// 🚀 تحديث بيانات المستخدم
//
export async function updateUser(uid, data){
  return updateDoc(doc(db, "users", uid), data);
}

//
// 🚀 مراقبة تسجيل الدخول
//
export function getUser(callback){
  onAuthStateChanged(auth, callback);
}

//
// 🚀 رفع صورة (Cloudinary)
//
export async function uploadProfileImage(file){

  if(!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "hoshos_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgtazde5z/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  console.log("UPLOAD RESULT:", data);

  return data.secure_url;
}

//
// 🚀 البحث عن مستخدمين
//
export async function searchUsers(searchText){

  const snap = await getDocs(collection(db, "users"));
  const results = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();

    if(
      data.username &&
      data.username.toLowerCase().includes(searchText.toLowerCase())
    ){
      results.push({
        uid: docSnap.id,
        ...data
      });
    }
  });

  return results;
}

//
// 🚀 متابعة مستخدم
//
export async function followUser(myUid, targetUid){

  try{
    if(myUid === targetUid){
      alert("لا يمكنك متابعة نفسك");
      return;
    }

    await updateDoc(doc(db, "users", myUid), {
      following: increment(1)
    });

    await updateDoc(doc(db, "users", targetUid), {
      followers: increment(1)
    });

    console.log("FOLLOW SUCCESS");

  }catch(err){
    console.log("FOLLOW ERROR:", err);
    alert("خطأ: " + err.message);
  }
}
