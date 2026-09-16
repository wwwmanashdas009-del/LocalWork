// LocalWork V3 - Firebase Authentication + Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIjUlpWwSGsZK8WzEeNYMgH8qG3tamyek",
  authDomain: "localwork-f6460.firebaseapp.com",
  projectId: "localwork-f6460",
  storageBucket: "localwork-f6460.firebasestorage.app",
  messagingSenderId: "738787718967",
  appId: "1:738787718967:web:1c5abb9d77528c8b854cb2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = s => document.querySelector(s);
const esc = x => String(x ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let jobs = [];
let profile = null;
let currentUser = null;
let authMode = "login";

function toast(x){
  $("#toast").textContent = x;
  $("#toast").classList.add("show");
  clearTimeout(window.t);
  window.t = setTimeout(()=>$("#toast").classList.remove("show"),3000);
}
function openM(id){ $("#"+id).classList.add("open"); }
function closeM(el){ el.closest(".modal")?.classList.remove("open"); }

document.querySelectorAll("[data-open]").forEach(x=>x.onclick=()=>openM(x.dataset.open));
document.querySelectorAll("[data-close]").forEach(x=>x.onclick=()=>closeM(x));
document.querySelectorAll(".modal").forEach(x=>x.onclick=e=>{if(e.target===x)x.classList.remove("open")});
document.querySelectorAll("[data-scroll]").forEach(x=>x.onclick=()=>document.getElementById(x.dataset.scroll).scrollIntoView({behavior:"smooth"}));
document.querySelectorAll("[data-cat]").forEach(x=>x.onclick=()=>{$("#category").value=x.dataset.cat;render();document.getElementById("jobs").scrollIntoView({behavior:"smooth"})});
["search","area","category","sort"].forEach(id=>$("#"+id).addEventListener("input",render));

function setAuthMode(mode){
  authMode = mode;
  $("#authTitle").textContent = mode==="login" ? "Login" : "Create account";
  $("#authSubmit").textContent = mode==="login" ? "Login" : "Sign up";
  $("#authHint").textContent = mode==="login" ? "Use your email and password." : "Create your LocalWork account.";
  $("#authSwitch").textContent = mode==="login" ? "Create a new account" : "Already have an account? Login";
}

$("#authButton").onclick=()=>{
  if(currentUser) signOut(auth);
  else { setAuthMode("login"); $("#authModal").classList.add("open"); }
};
$("#authSwitch").onclick=()=>setAuthMode(authMode==="login" ? "signup" : "login");

$("#authForm").onsubmit=async e=>{
  e.preventDefault();
  const f=Object.fromEntries(new FormData(e.target));
  try{
    if(authMode==="login"){
      await signInWithEmailAndPassword(auth,f.email,f.password);
      toast("Logged in successfully.");
    }else{
      const cred=await createUserWithEmailAndPassword(auth,f.email,f.password);
      await setDoc(doc(db,"users",cred.user.uid),{
        email:f.email, role:"Freelancer", createdAt:serverTimestamp()
      },{merge:true});
      toast("Account created.");
    }
    e.target.reset();
    $("#authModal").classList.remove("open");
  }catch(err){
    console.error(err);
    toast(err.code?.replace("auth/","") || err.message);
  }
};

$("#logoutButton").onclick=async()=>{
  await signOut(auth);
  $("#authModal").classList.remove("open");
  toast("Logged out.");
};

onAuthStateChanged(auth, async user=>{
  currentUser=user;
  $("#profileButton").style.display=user ? "inline-block" : "none";
  $("#authButton").textContent=user ? "Logout" : "Login / Sign up";
  $("#logoutButton").style.display=user ? "block" : "none";
  if(user){
    const snap=await getDoc(doc(db,"users",user.uid));
    profile=snap.exists()?snap.data():null;
    if(profile){
      Object.entries(profile).forEach(([k,v])=>{
        const el=$(`#profileForm [name="${k}"]`);
        if(el && typeof v==="string") el.value=v;
      });
    }
  }else{
    profile=null;
  }
  await loadJobs();
  render();
});

async function loadJobs(){
  try{
    const q=query(collection(db,"jobs"),orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    jobs=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(err){
    console.error(err);
    jobs=[];
    toast("Could not load jobs. Check Firestore rules.");
  }
}

function render(){
  const q=$("#search").value.toLowerCase(), a=$("#area").value, c=$("#category").value, s=$("#sort").value;
  let list=jobs.filter(j=>
    (!q||(`${j.title} ${j.description} ${j.category} ${j.area}`).toLowerCase().includes(q)) &&
    (!a||j.area===a) && (!c||j.category===c)
  );
  if(s==="budget") list.sort((x,y)=>Number(y.budget)-Number(x.budget));
  $("#jobsGrid").innerHTML=list.map(j=>`
    <article class="job">
      <div class="jobtop"><span class="tag">${esc(j.category)}</span><span class="budget">₹${Number(j.budget||0).toLocaleString("en-IN")}</span></div>
      <h3>${esc(j.title)}</h3>
      <div class="desc">${esc(j.description)}</div>
      <div class="meta">📍 ${esc(j.area)} • ${esc(j.contact)}</div>
      <button class="contact" onclick="contactJob('${encodeURIComponent(j.contact||"")}','${encodeURIComponent(j.contactValue||"")}')">Contact client</button>
    </article>`).join("");
  $("#empty").classList.toggle("hidden",list.length>0);
  $("#jobCount").textContent=jobs.length;
  $("#profileCount").textContent=currentUser?1:0;
}
window.contactJob=(m,v)=>toast(decodeURIComponent(m)+": "+decodeURIComponent(v));

$("#jobForm").onsubmit=async e=>{
  e.preventDefault();
  if(!currentUser){
    setAuthMode("login");
    openM("authModal");
    toast("Please login first.");
    return;
  }
  const f=Object.fromEntries(new FormData(e.target));
  try{
    await addDoc(collection(db,"jobs"),{
      title:f.title, category:f.category, area:f.area,
      budget:Number(f.budget), description:f.description,
      contact:f.contact, contactValue:f.contactValue,
      ownerId:currentUser.uid, ownerEmail:currentUser.email,
      createdAt:serverTimestamp()
    });
    e.target.reset();
    e.target.closest(".modal").classList.remove("open");
    await loadJobs(); render();
    toast("Job published for everyone.");
  }catch(err){
    console.error(err);
    toast(err.code?.replace("firestore/","") || err.message);
  }
};

$("#profileForm").onsubmit=async e=>{
  e.preventDefault();
  if(!currentUser){
    setAuthMode("login");
    openM("authModal");
    return;
  }
  const f=Object.fromEntries(new FormData(e.target));
  try{
    await setDoc(doc(db,"users",currentUser.uid),{
      ...f,email:currentUser.email,updatedAt:serverTimestamp()
    },{merge:true});
    profile=f;
    e.target.closest(".modal").classList.remove("open");
    render();
    toast("Profile saved to Firebase.");
  }catch(err){
    console.error(err);
    toast(err.message);
  }
};

$("#year").textContent=new Date().getFullYear();
setAuthMode("login");
