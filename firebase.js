import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

/* AUTH */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* FIRESTORE */

import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  increment,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* CONFIG */

const firebaseConfig = {

  apiKey:
  "AIzaSyBfHLGUVuqrzxc42BkO4ZAzbIxJSt7jZFw",

  authDomain:
  "hos-hos.firebaseapp.com",

  projectId:
  "hos-hos",

  storageBucket:
  "hos-hos.appspot.com",

  messagingSenderId:
  "817137342563",

  appId:
  "1:817137342563:web:d714d48c46796cc4c34056"
};

/* INIT */

const app =
initializeApp(firebaseConfig);

export const auth =
getAuth(app);

export const db =
getFirestore(app);

/* =========================
   REGISTER
========================= */

export async function register(
  email,
  password,
  username
){

  const userCred =
  await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user =
  userCred.user;

  await setDoc(
    doc(db,"users",user.uid),
    {

      username,

      email,

      image:"",

      verified:false,

      followers:0,

      following:0,

      videos:0,

      likes:0,

      bio:"",

      followingList:[],

      followersList:[],

      createdAt:
      Date.now()
    }
  );

  return user;
}

/* =========================
   LOGIN
========================= */

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

/* =========================
   LOGOUT
========================= */

export function logout(){

  return signOut(auth);
}

/* =========================
   USER LISTENER
========================= */

export function getUser(callback){

  onAuthStateChanged(
    auth,
    callback
  );
}

/* =========================
   GET USER DATA
========================= */

export async function getUserData(uid){

  const snap =
  await getDoc(
    doc(db,"users",uid)
  );

  if(snap.exists()){

    return snap.data();
  }

  return {

    username:"بدون اسم",

    image:"",

    verified:false,

    followers:0,

    following:0,

    followingList:[],

    followersList:[],

    videos:0
  };
}

/* =========================
   UPDATE USER
========================= */

export async function updateUser(
  uid,
  data
){

  return await updateDoc(
    doc(db,"users",uid),
    data
  );
}

/* =========================
   UPLOAD IMAGE
========================= */

export async function uploadProfileImage(file){

  if(!file)
  return null;

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

/* =========================
   SEARCH USERS
========================= */

export async function searchUsers(
  searchText
){

  const snap =
  await getDocs(
    collection(db,"users")
  );

  const results=[];

  snap.forEach(docSnap=>{

    const data =
    docSnap.data();

    if(

      data.username &&

      data.username
      .toLowerCase()
      .includes(
        searchText.toLowerCase()
      )

    ){

      results.push({

        uid:docSnap.id,

        ...data
      });
    }

  });

  return results;
}

/* =========================
   FOLLOW SYSTEM
========================= */

export async function isFollowing(
  myUid,
  targetUid
){

  const snap =
  await getDoc(
    doc(db,"users",myUid)
  );

  if(!snap.exists())
  return false;

  const data =
  snap.data();

  return (
    data.followingList
    ?.includes(targetUid)
    || false
  );
}

export async function toggleFollow(
  myUid,
  targetUid
){

  if(myUid === targetUid)
  return false;

  const myRef =
  doc(db,"users",myUid);

  const targetRef =
  doc(db,"users",targetUid);

  const mySnap =
  await getDoc(myRef);

  const targetSnap =
  await getDoc(targetRef);

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
  myData.followingList || [];

  let followersList =
  targetData.followersList || [];

  const alreadyFollowing =
  followingList.includes(
    targetUid
  );

  if(alreadyFollowing){

    followingList =
    followingList.filter(
      id => id !== targetUid
    );

    followersList =
    followersList.filter(
      id => id !== myUid
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

/* =========================
   COMMENTS
========================= */

export async function addComment(

  videoId,

  uid,

  text

){

  const user =
  await getUserData(uid);

  await addDoc(

    collection(
      db,
      "videos",
      videoId,
      "comments"
    ),

    {

      uid,

      username:
      user.username || "مستخدم",

      userImage:
      user.image || "",

      text,

      createdAt:
      Date.now()
    }
  );

  await updateDoc(

    doc(db,"videos",videoId),

    {

      comments:
      increment(1)
    }
  );
}

/* =========================
   LISTEN COMMENTS
========================= */

export function listenComments(

  videoId,

  callback

){

  const q =
  query(

    collection(
      db,
      "videos",
      videoId,
      "comments"
    ),

    orderBy(
      "createdAt",
      "asc"
    )
  );

  return onSnapshot(
    q,
    snap=>{

      const arr=[];

      snap.forEach(doc=>{

        arr.push({

          id:doc.id,

          ...doc.data()
        });

      });

      callback(arr);

    }
  );
}

/* =========================
   MESSAGES
========================= */

export async function sendMessage(

  fromUid,

  toUid,

  data

){

  const roomId =
  [fromUid,toUid]
  .sort()
  .join("_");

  let lastMsg =
  "📩 رسالة";

  if(data.type==="text"){

    lastMsg =
    data.text;
  }

  if(data.type==="image"){

    lastMsg =
    "🖼️ صورة";
  }

  if(data.type==="voice"){

    lastMsg =
    "🎤 رسالة صوتية";
  }

  await setDoc(

    doc(
      db,
      "chats",
      roomId
    ),

    {

      users:[
        fromUid,
        toUid
      ],

      lastMessage:
      lastMsg,

      updatedAt:
      Date.now()
    },

    {
      merge:true
    }
  );

  await addDoc(

    collection(
      db,
      "chats",
      roomId,
      "messages"
    ),

    {

      ...data,

      from:
      fromUid,

      to:
      toUid,

      createdAt:
      Date.now()
    }
  );
}

/* =========================
   LISTEN MESSAGES
========================= */

export function listenMessages(

  myUid,

  otherUid,

  callback

){

  const roomId =
  [myUid,otherUid]
  .sort()
  .join("_");

  const q =
  query(

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

  return onSnapshot(
    q,
    snap=>{

      const msgs=[];

      snap.forEach(doc=>{

        msgs.push({

          id:doc.id,

          ...doc.data()
        });

      });

      callback(msgs);

    }
  );
    }
