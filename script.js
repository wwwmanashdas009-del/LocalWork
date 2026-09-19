import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyBIjUlpWwSGsZK8WzEeNYMgH8qG3tamyek",
  authDomain: "localwork-f6460.firebaseapp.com",
  projectId: "localwork-f6460",
  storageBucket: "localwork-f6460.firebasestorage.app",
  messagingSenderId: "738787718967",
  appId: "1:738787718967:web:1c5abb9d77528c8b854cb2"
};


// =====================================================
// FIREBASE INIT
// =====================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =====================================================
// HELPERS
// =====================================================

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}

/*
  IMPORTANT:
  New V5 HTML mostly uses IDs.
  Old JS was looking only for name="".
  This function supports BOTH.
*/
function getField(form, name, id = null) {
  if (!form) return "";

  let field = form.querySelector(`[name="${name}"]`);

  if (!field && id) {
    field = document.getElementById(id);
  }

  if (!field) {
    field = form.querySelector(`#${name}`);
  }

  return field ? String(field.value || "").trim() : "";
}

function safeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function encode(value) {
  return encodeURIComponent(String(value ?? ""));
}

function decode(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}


// =====================================================
// TOAST
// =====================================================

function toast(message, title = "LocalWork") {

  const box = $("#toast");

  if (!box) {
    alert(message);
    return;
  }

  const titleEl = $("#toastTitle");
  const textEl = $("#toastText");
  const iconEl = $("#toastIcon");

  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = message;
  if (iconEl) iconEl.textContent = "✓";

  box.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 3000);
}


// =====================================================
// MODALS
// =====================================================

function openModal(id) {

  const modal = document.getElementById(id);

  if (!modal) {
    console.warn("Modal not found:", id);
    return;
  }

  modal.classList.add("open");
  modal.classList.add("show");

  document.body.classList.add("modal-open");
}


function closeModal(id) {

  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.remove("show");

  if (!document.querySelector(".modal.open")) {
    document.body.classList.remove("modal-open");
  }
}


function closeAllModals() {

  $$(".modal").forEach((modal) => {
    modal.classList.remove("open");
    modal.classList.remove("show");
  });

  document.body.classList.remove("modal-open");
}


// =====================================================
// STATE
// =====================================================

let currentUser = null;
let currentProfile = {};
let jobs = [];
let authMode = "login";
