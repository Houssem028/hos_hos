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

  const userCred =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const user = userCred.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      username,
      email,
      image: "",
      followers: 0,
      following: 0,
      followingList: [],
      followersList: [],
      videos: 0,
      createdAt:
        new Date().toISOString()
    }
  );

  return user;
}

//
// تسجيل دخول
//
export function login(
  email,
  password
){
  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );
}

//
// جلب بيانات المستخدم
//
export async function getUserData(uid){

  const snap =
    await getDoc(
      doc(db, "users", uid)
    );

  if(snap.exists()){
    return snap.data();
  }

  return {
    username: "بدون اسم",
    image: "",
    followers: 0,
    following: 0,
    followingList: [],
    followersList: [],
    videos: 0
  };
}

//
// تحديث بيانات المستخدم
//
export async function updateUser(
  uid,
  data
){
  return updateDoc(
    doc(db, "users", uid),
    data
  );
}

//
// مراقبة تسجيل الدخول
//
export function getUser(
  callback
){
  onAuthStateChanged(
    auth,
    callback
  );
}

//
// رفع صورة (Cloudinary)
//
export async function uploadProfileImage(file){

  if(!file) return null;

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "upload_preset",
    "hoshos_upload"
  );

  const res =
    await fetch(
      "https://api.cloudinary.com/v1_1/dgtazde5z/image/upload",
      {
        method:"POST",
        body:formData
      }
    );

  const data =
    await res.json();

  return data.secure_url;
}

//
// البحث عن مستخدمين
//
export async function searchUsers(searchText){

  const snap =
    await getDocs(
      collection(
        db,
        "users"
      )
    );

  const results = [];

  snap.forEach((docSnap)=>{

    const data =
      docSnap.data();

    if(
      data.username &&
      data.username
      .toLowerCase()
      .includes(
        searchText
        .toLowerCase()
      )
    ){
      results.push({
        uid:
          docSnap.id,
        ...data
      });
    }
  });

  return results;
}

//
// هل أتابعه؟
//
export async function isFollowing(
  myUid,
  targetUid
){

  const snap =
    await getDoc(
      doc(
        db,
        "users",
        myUid
      )
    );

  if(!snap.exists())
    return false;

  const data =
    snap.data();

  return (
    data.followingList
    ?.includes(
      targetUid
    ) || false
  );
}

//
// متابعة / إلغاء متابعة
//
export async function toggleFollow(
  myUid,
  targetUid
){

  if(
    myUid === targetUid
  ) return false;

  const myRef =
    doc(
      db,
      "users",
      myUid
    );

  const targetRef =
    doc(
      db,
      "users",
      targetUid
    );

  const mySnap =
    await getDoc(
      myRef
    );

  const targetSnap =
    await getDoc(
      targetRef
    );

  if(
    !mySnap.exists() ||
    !targetSnap.exists()
  ){
    return false;
  }

  const myData =
    mySnap.data();

  const targetData =
    targetSnap.data();

  let followingList =
    myData
    .followingList || [];

  let followersList =
    targetData
    .followersList || [];

  const alreadyFollowing =
    followingList.includes(
      targetUid
    );

  if(alreadyFollowing){

    // Unfollow
    followingList =
      followingList.filter(
        id =>
          id !==
          targetUid
      );

    followersList =
      followersList.filter(
        id =>
          id !==
          myUid
      );

    await updateDoc(
      myRef,
      {
        following:
          increment(-1),
        followingList
      }
    );

    await updateDoc(
      targetRef,
      {
        followers:
          increment(-1),
        followersList
      }
    );

    return false;

  }else{

    // Follow
    followingList.push(
      targetUid
    );

    followersList.push(
      myUid
    );

    await updateDoc(
      myRef,
      {
        following:
          increment(1),
        followingList
      }
    );

    await updateDoc(
      targetRef,
      {
        followers:
          increment(1),
        followersList
      }
    );

    return true;
  }
}

//
// حتى search يشتغل
//
export async function followUser(
  myUid,
  targetUid
){
  return await toggleFollow(
    myUid,
    targetUid
  );
}

//
// جلب مستخدمين من ids
//
export async function getUsersByIds(ids){

  const arr = [];

  for(
    const uid of ids
  ){

    const snap =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );

    if(
      snap.exists()
    ){
      arr.push({
        uid,
        ...snap.data()
      });
    }
  }

  return arr;
}
//
// جلب قائمة المتابعين
//
export async function getFollowersList(uid){

  const usersSnap = await getDocs(collection(db,"users"));
  const result = [];

  usersSnap.forEach(docSnap=>{

    const data = docSnap.data();

    const list = data.followingList || [];

    if(list.includes(uid)){
      result.push({
        uid: docSnap.id,
        ...data
      });
    }
  });

  return result;
}

//
// جلب قائمة المتابَعين
//
export async function getFollowingList(uid){

  const myData = await getUserData(uid);

  const ids = myData.followingList || [];

  const result = [];

  for(const userId of ids){

    const data = await getUserData(userId);

    result.push({
      uid:userId,
      ...data
    });
  }

  return result;
}
//
// إرسال رسالة
//
import {
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function sendMessage(
  fromUid,
  toUid,
  text
){

  const roomId =
    [fromUid,toUid]
    .sort()
    .join("_");

  await addDoc(
    collection(db,"chats",roomId,"messages"),
    {
      from: fromUid,
      to: toUid,
      text: text,
      createdAt: Date.now()
    }
  );
}

//
// مراقبة الرسائل
//
export function listenMessages(
  myUid,
  otherUid,
  callback
){

  const roomId =
    [myUid,otherUid]
    .sort()
    .join("_");

  const q = query(
    collection(
      db,
      "chats",
      roomId,
      "messages"
    ),
    orderBy(
      "createdAt",
      "asc"
    )
  );

  return onSnapshot(q,(snap)=>{

    const msgs=[];

    snap.forEach(doc=>{

      msgs.push(
        doc.data()
      );

    });

    callback(msgs);

  });
}
//
// جلب قائمة المحادثات
//
export async function getChatsList(myUid){

  const chatsSnap = await getDocs(
    collection(db,"chats")
  );

  const result = [];

  for(const chatDoc of chatsSnap.docs){

    const roomId = chatDoc.id;

    // نتأكد أن المستخدم داخل هذي الغرفة
    if(!roomId.includes(myUid)) continue;

    const ids = roomId.split("_");

    const otherUid =
      ids[0]===myUid
      ? ids[1]
      : ids[0];

    const userData =
      await getUserData(otherUid);

    result.push({
      uid: otherUid,
      ...userData
    });
  }

  return result;
}
