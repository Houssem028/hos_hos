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
increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* CONFIG */
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

/* ================= USERS ================= */

export async function getUserData(uid){
const snap = await getDoc(doc(db,"users",uid));

if(snap.exists()) return snap.data();

return {
username:"مستخدم",
image:"",
verified:false
};
}

/* ================= FOLLOW (بدون تغيير) ================= */

export async function toggleFollow(myUid,targetUid){

const myRef = doc(db,"users",myUid);
const targetRef = doc(db,"users",targetUid);

const mySnap = await getDoc(myRef);
const targetSnap = await getDoc(targetRef);

if(!mySnap.exists() || !targetSnap.exists()) return;

const myData = mySnap.data();
const targetData = targetSnap.data();

let myList = myData.followingList || [];
let targetList = targetData.followersList || [];

const isFollowing = myList.includes(targetUid);

if(isFollowing){

myList = myList.filter(i=>i!==targetUid);
targetList = targetList.filter(i=>i!==myUid);

await updateDoc(myRef,{
followingList:myList,
following:increment(-1)
});

await updateDoc(targetRef,{
followersList:targetList,
followers:increment(-1)
});

}else{

myList.push(targetUid);
targetList.push(myUid);

await updateDoc(myRef,{
followingList:myList,
following:increment(1)
});

await updateDoc(targetRef,{
followersList:targetList,
followers:increment(1)
});
}

}

/* ================= COMMENTS (كما هي عندك) ================= */

export async function addComment(videoId,uid,text){

const user = await getUserData(uid);

await addDoc(collection(db,"comments"),{
videoId,
uid,
username:user.username,
userImage:user.image || "",
text,
createdAt:Date.now()
});
}

/* ================= MESSAGES (مهم جداً) ================= */

export async function sendMessage(fromUid,toUid,data){

const roomId = [fromUid,toUid].sort().join("_");

/* حفظ أو إنشاء الشات */
await setDoc(doc(db,"chats",roomId),{
users:[fromUid,toUid],
updatedAt:Date.now(),
lastMessage:
data.type === "text"
? data.text
: data.type === "image"
? "🖼️ صورة"
: data.type === "voice"
? "🎤 فويس"
: "📩 رسالة"
},{merge:true});

/* الرسالة نفسها */
await addDoc(
collection(db,"chats",roomId,"messages"),
{
...data,
from:fromUid,
to:toUid,
createdAt:Date.now()
}
);

}

/* 🔥 REALTIME MESSAGES (كما كان عندك) */
export function listenMessages(myUid,otherUid,cb){

const roomId = [myUid,otherUid].sort().join("_");

const q = query(
collection(db,"chats",roomId,"messages"),
orderBy("createdAt","asc")
);

return onSnapshot(q,snap=>{

const msgs = [];

snap.forEach(d=>{
msgs.push({id:d.id,...d.data()});
});

cb(msgs);

});
}

/* ================= 🔥 NEW FIX: CHAT LIST ================= */

export async function getChatsList(uid){

const snap = await getDocs(collection(db,"chats"));

const chats = [];

snap.forEach(d=>{

const data = d.data();

if(data.users?.includes(uid)){

const otherUid = data.users.find(u=>u !== uid);

chats.push({
uid: otherUid,
username: "مستخدم",
image: "",
lastMessage: data.lastMessage || "",
updatedAt: data.updatedAt || 0
});

}

});

return chats.sort((a,b)=>b.updatedAt - a.updatedAt);
}
