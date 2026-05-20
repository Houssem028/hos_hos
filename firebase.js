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

/* ================= USERS ================= */

export async function getUserData(uid){

const snap =
await getDoc(
doc(db,"users",uid)
);

if(snap.exists()){

return snap.data();

}

return {

username:"مستخدم",

image:"",

verified:false,

followers:0,

following:0

};

}

/* ================= UPDATE USER ================= */

export async function updateUser(uid,data){

await updateDoc(
doc(db,"users",uid),
data
);

}

/* ================= UPLOAD PROFILE IMAGE ================= */

export async function uploadProfileImage(file){

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

/* ================= FOLLOW ================= */

export async function toggleFollow(myUid,targetUid){

const myRef =
doc(db,"users",myUid);

const targetRef =
doc(db,"users",targetUid);

const mySnap =
await getDoc(myRef);

const targetSnap =
await getDoc(targetRef);

if(
!mySnap.exists()
||
!targetSnap.exists()
) return;

const myData =
mySnap.data();

const targetData =
targetSnap.data();

let myList =
myData.followingList || [];

let targetList =
targetData.followersList || [];

const isFollowing =
myList.includes(targetUid);

if(isFollowing){

myList =
myList.filter(
i=>i!==targetUid
);

targetList =
targetList.filter(
i=>i!==myUid
);

await updateDoc(
myRef,
{
followingList:myList,
following:increment(-1)
}
);

await updateDoc(
targetRef,
{
followersList:targetList,
followers:increment(-1)
}
);

}else{

myList.push(targetUid);

targetList.push(myUid);

await updateDoc(
myRef,
{
followingList:myList,
following:increment(1)
}
);

await updateDoc(
targetRef,
{
followersList:targetList,
followers:increment(1)
}
);

}

}

/* ================= COMMENTS SYSTEM ================= */

/* إضافة تعليق */

export async function addComment(videoId,uid,text,parentId=null){

const user =
await getUserData(uid);

await addDoc(
collection(db,"comments"),
{
videoId,

parentId,

uid,

username:
user.username || "مستخدم",

userImage:
user.image || "",

verified:
user.verified || false,

text,

likes:0,

likedBy:[],

createdAt:
Date.now()
}
);

/* زيادة عداد التعليقات */

if(!parentId){

await updateDoc(
doc(db,"videos",videoId),
{
comments:
increment(1)
}
);

}

}

/* جلب التعليقات مباشر */

export function listenComments(videoId,callback){

const q =
query(
collection(db,"comments"),
where("videoId","==",videoId),
orderBy("createdAt","desc")
);

return onSnapshot(q,(snap)=>{

const comments = [];

snap.forEach(doc=>{

comments.push({
id:doc.id,
...doc.data()
});

});

callback(comments);

});

}

/* لايك تعليق */

export async function likeComment(commentId,currentUid){

const ref =
doc(db,"comments",commentId);

const snap =
await getDoc(ref);

if(!snap.exists())
return;

const data =
snap.data();

let likedBy =
data.likedBy || [];

if(
likedBy.includes(currentUid)
){
return;
}

likedBy.push(currentUid);

await updateDoc(ref,{
likes:increment(1),
likedBy
});

}

/* ================= LIKE VIDEO ================= */

export async function likeVideo(videoId){

await updateDoc(
doc(db,"videos",videoId),
{
likes:
increment(1)
}
);

}

/* ================= SHARE VIDEO ================= */

export async function shareVideoCount(videoId){

await updateDoc(
doc(db,"videos",videoId),
{
shares:
increment(1)
}
);

}

/* ================= GET VIDEOS ================= */

export async function getVideos(){

const q =
query(
collection(db,"videos"),
orderBy("createdAt","desc")
);

const snap =
await getDocs(q);

const videos = [];

snap.forEach(doc=>{

videos.push({
id:doc.id,
...doc.data()
});

});

return videos;

}

/* ================= GET USER VIDEOS ================= */

export async function getUserVideos(uid){

const q =
query(
collection(db,"videos"),
where("uid","==",uid),
orderBy("createdAt","desc")
);

const snap =
await getDocs(q);

const videos = [];

snap.forEach(doc=>{

videos.push({
id:doc.id,
...doc.data()
});

});

return videos;

}

/* ================= MESSAGES ================= */

export async function sendMessage(fromUid,toUid,data){

const roomId =
[fromUid,toUid]
.sort()
.join("_");

/* إنشاء الشات */

await setDoc(
doc(db,"chats",roomId),
{
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

},
{
merge:true
}
);

/* الرسالة */

await addDoc(

collection(
db,
"chats",
roomId,
"messages"
),

{
...data,

from:fromUid,

to:toUid,

createdAt:Date.now()
}

);

}

/* ================= LISTEN MESSAGES ================= */

export function listenMessages(myUid,otherUid,cb){

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
orderBy("createdAt","asc")
);

return onSnapshot(q,snap=>{

const msgs = [];

snap.forEach(d=>{

msgs.push({
id:d.id,
...d.data()
});

});

cb(msgs);

});

}

/* ================= CHATS LIST ================= */

export async function getChatsList(uid){

const snap =
await getDocs(
collection(db,"chats")
);

const chats = [];

for(const d of snap.docs){

const data =
d.data();

if(
data.users?.includes(uid)
){

const otherUid =
data.users.find(
u=>u !== uid
);

const otherUser =
await getUserData(otherUid);

chats.push({

uid:otherUid,

username:
otherUser.username || "مستخدم",

image:
otherUser.image || "",

verified:
otherUser.verified || false,

lastMessage:
data.lastMessage || "",

updatedAt:
data.updatedAt || 0

});

}

}

return chats.sort(
(a,b)=>
b.updatedAt - a.updatedAt
);

  }
