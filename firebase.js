import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  increment,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= CONFIG ================= */

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

/* ================= AUTH ================= */

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email, password, userData = {}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    username: userData.username || "مستخدم",
    email: user.email,
    image: userData.image || "",
    bio: userData.bio || "",
    verified: false,
    followers: 0,
    following: 0,
    followersList: [],
    followingList: [],
    createdAt: Date.now()
  });

  return user;
}

export async function logout() {
  return signOut(auth);
}

export function authState(cb) {
  return onAuthStateChanged(auth, cb);
}

/* ================= USERS / PROFILE ================= */

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  if (snap.exists()) return snap.data();

  return {
    username: "مستخدم",
    image: "",
    bio: "",
    verified: false,
    followers: 0,
    following: 0
  };
}

/* 🔥 PROFILE UPDATE */
export async function updateUser(uid, data) {
  return updateDoc(doc(db, "users", uid), data);
}

/* ================= FOLLOW ================= */

export async function toggleFollow(myUid, targetUid) {
  const myRef = doc(db, "users", myUid);
  const targetRef = doc(db, "users", targetUid);

  const mySnap = await getDoc(myRef);
  const targetSnap = await getDoc(targetRef);

  if (!mySnap.exists() || !targetSnap.exists()) return;

  const myData = mySnap.data();
  const targetData = targetSnap.data();

  let myList = myData.followingList || [];
  let targetList = targetData.followersList || [];

  const isFollowing = myList.includes(targetUid);

  if (isFollowing) {
    myList = myList.filter(i => i !== targetUid);
    targetList = targetList.filter(i => i !== myUid);

    await updateDoc(myRef, {
      followingList: myList,
      following: increment(-1)
    });

    await updateDoc(targetRef, {
      followersList: targetList,
      followers: increment(-1)
    });

  } else {
    myList.push(targetUid);
    targetList.push(myUid);

    await updateDoc(myRef, {
      followingList: myList,
      following: increment(1)
    });

    await updateDoc(targetRef, {
      followersList: targetList,
      followers: increment(1)
    });
  }
}

/* ================= COMMENTS ================= */

export async function addComment(videoId, uid, text, parentId = null) {
  const user = await getUserData(uid);

  await addDoc(collection(db, "comments"), {
    videoId,
    parentId,
    uid,
    username: user.username,
    userImage: user.image || "",
    verified: user.verified || false,
    text,
    likes: 0,
    likedBy: [],
    createdAt: Date.now()
  });

  if (!parentId) {
    await updateDoc(doc(db, "videos", videoId), {
      comments: increment(1)
    });
  }
}

/* ================= COMMENTS LIVE (FIXED) ================= */

export function listenComments(videoId, callback) {
  const q = query(
    collection(db, "comments"),
    where("videoId", "==", videoId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const comments = [];

    snap.forEach(d => {
      comments.push({ id: d.id, ...d.data() });
    });

    callback(comments);
  });
}

/* ================= MESSAGES (FIXED + STABLE) ================= */

export async function sendMessage(fromUid, toUid, data) {
  const roomId = [fromUid, toUid].sort().join("_");

  const text =
    data.type === "text"
      ? data.text
      : data.type === "image"
      ? "🖼️ صورة"
      : data.type === "voice"
      ? "🎤 فويس"
      : "📩 رسالة";

  await setDoc(
    doc(db, "chats", roomId),
    {
      users: [fromUid, toUid],
      updatedAt: Date.now(),
      lastMessage: text
    },
    { merge: true }
  );

  await addDoc(collection(db, "chats", roomId, "messages"), {
    ...data,
    from: fromUid,
    to: toUid,
    createdAt: Date.now()
  });
}

/* 🔥 LIVE MESSAGES FIXED */
export function listenMessages(myUid, otherUid, cb) {
  const roomId = [myUid, otherUid].sort().join("_");

  const q = query(
    collection(db, "chats", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const msgs = [];

    snap.forEach(d => {
      msgs.push({ id: d.id, ...d.data() });
    });

    cb(msgs);
  });
}

/* ================= CHATS LIST ================= */

export async function getChatsList(uid) {
  const snap = await getDocs(collection(db, "chats"));

  const chats = [];

  for (const d of snap.docs) {
    const data = d.data();

    if (data.users?.includes(uid)) {
      const otherUid = data.users.find(u => u !== uid);
      const otherUser = await getUserData(otherUid);

      chats.push({
        uid: otherUid,
        username: otherUser.username,
        image: otherUser.image,
        verified: otherUser.verified,
        lastMessage: data.lastMessage,
        updatedAt: data.updatedAt || 0
      });
    }
  }

  return chats.sort((a, b) => b.updatedAt - a.updatedAt);
}
