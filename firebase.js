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

/* LOGIN */

export async function login(email,password){

return await signInWithEmailAndPassword(
auth,
email,
password
);

}

/* SIGNUP */

export async function signup(
email,
password,
userData={}
){

const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);

const user =
userCredential.user;

await setDoc(
doc(db,"users",user.uid),
{

uid:user.uid,

username:
userData.username || "مستخدم",

email:user.email,

image:
userData.image || "",

bio:
userData.bio || "",

verified:false,

followers:0,

following:0,

followersList:[],

followingList:[],

createdAt:
Date.now()

}
);

return user;

}

/* LOGOUT */

export async function logout(){

await signOut(auth);

}

/* AUTH STATE */

export function authState(callback){

return onAuthStateChanged(
auth,
callback
);

}

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

/* ================= COMMENTS ================= */

export async function addComment(
videoId,
uid,
text,
parentId=null
){

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

/* ================= LIVE COMMENTS ================= */

export function listenComments(
videoId,
callback
){

const q =
query(
collection(db,"comments"),
where(
"videoId",
"==",
videoId
),
orderBy(
"createdAt",
"desc"
)
);

return onSnapshot(
q,
(snap)=>{

const comments = [];

snap.forEach(doc=>{

comments.push({
id:doc.id,
...doc.data()
});

});

callback(comments);

}
);

}

/* ================= LIKE COMMENT ================= */

export async function likeComment(
commentId,
currentUid
){

const ref =
doc(
db,
"comments",
commentId
);

const snap =
await getDoc(ref);

if(!snap.exists())
return;

const data =
snap.data();

let likedBy =
data.likedBy || [];

if(
likedBy.includes(
currentUid
)
){
return;
}

likedBy.push(currentUid);

await updateDoc(
ref,
{
likes:
increment(1),

likedBy
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
