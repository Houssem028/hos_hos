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
// تسجيل حساب
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
    followingList: [],
    videos: 0,
    createdAt: new Date().toISOString()
  });

  return user;
}

//
// تسجيل دخول
//
export function login(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

//
// جلب بيانات المستخدم
//
export async function getUserData(uid){

  const snap = await getDoc(doc(db, "users", uid));

  if(snap.exists()){
    return snap.data();
  }

  return {
    username: "بدون اسم",
    image: "",
    followers: 0,
    following: 0,
    followingList: [],
    videos: 0
  };
}

//
// تحديث بيانات المستخدم
//
export async function updateUser(uid, data){
  return updateDoc(doc(db, "users", uid), data);
}

//
// مراقبة تسجيل الدخول
//
export function getUser(callback){
  onAuthStateChanged(auth, callback);
}

//
// رفع صورة (Cloudinary)
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

  return data.secure_url;
}

//
// البحث عن مستخدمين
//
export async function searchUsers(searchText){

  const snap = await getDocs(collection(db, "users"));
  const results = [];

  snap.forEach((docSnap)=>{

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
// هل أتابعه؟
//
export async function isFollowing(myUid, targetUid){

  const snap = await getDoc(doc(db, "users", myUid));

  if(!snap.exists()) return false;

  const data = snap.data();

  return data.followingList?.includes(targetUid) || false;
}

//
// متابعة / إلغاء متابعة
//
export async function toggleFollow(myUid, targetUid){

  if(myUid === targetUid) return false;

  const myRef = doc(db, "users", myUid);
  const targetRef = doc(db, "users", targetUid);

  const mySnap = await getDoc(myRef);

  if(!mySnap.exists()) return false;

  const myData = mySnap.data();

  let followingList = myData.followingList || [];

  const alreadyFollowing = followingList.includes(targetUid);

  if(alreadyFollowing){

    // Unfollow
    followingList = followingList.filter(
      id => id !== targetUid
    );

    await updateDoc(myRef,{
      following: increment(-1),
      followingList
    });

    await updateDoc(targetRef,{
      followers: increment(-1)
    });

    return false;

  }else{

    // Follow
    followingList.push(targetUid);

    await updateDoc(myRef,{
      following: increment(1),
      followingList
    });

    await updateDoc(targetRef,{
      followers: increment(1)
    });

    return true;
  }
}

//
// هذه حتى search.html يبقى يشتغل
//
export async function followUser(myUid, targetUid){
  return await toggleFollow(myUid, targetUid);
}
