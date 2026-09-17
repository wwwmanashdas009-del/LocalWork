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


// ===============================
// FIREBASE CONFIG
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBIjUlpWwSGsZK8WzEeNYMgH8qG3tamyek",
  authDomain: "localwork-f6460.firebaseapp.com",
  projectId: "localwork-f6460",
  storageBucket: "localwork-f6460.firebasestorage.app",
  messagingSenderId: "738787718967",
  appId: "1:738787718967:web:1c5abb9d77528c8b854cb2"
};


// ===============================
// FIREBASE INIT
// ===============================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================
// HELPERS
// ===============================

const $ = (selector) => document.querySelector(selector);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function toast(message) {
  const el = $("#toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}


// ===============================
// MODALS
// ===============================

function openM(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("open");
  }
}

function closeM(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("open");
  }
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openM(button.dataset.open);
  });
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");

    if (modal) {
      modal.classList.remove("open");
    }
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("open");
    }
  });
});


// ===============================
// MOBILE MENU
// ===============================

const mobileMenuBtn = $("#mobileMenuBtn");
const mobileMenu = $("#mobileMenu");

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
  });
}


// ===============================
// AUTH
// ===============================

let authMode = "login";
let currentUser = null;
let currentProfile = null;

function setAuthMode(mode) {
  authMode = mode;

  const title = $("#authTitle");
  const submit = $("#authSubmit");
  const switchButton = $("#authSwitch");

  if (title) {
    title.textContent =
      mode === "login"
        ? "Welcome back"
        : "Create your account";
  }

  if (submit) {
    submit.textContent =
      mode === "login"
        ? "Login"
        : "Create account";
  }

  if (switchButton) {
    switchButton.textContent =
      mode === "login"
        ? "Create a new account"
        : "Already have an account? Login";
  }
}

function toggleAuth() {
  setAuthMode(
    authMode === "login"
      ? "signup"
      : "login"
  );
}

const authSwitch = $("#authSwitch");

if (authSwitch) {
  authSwitch.addEventListener(
    "click",
    toggleAuth
  );
}


// ===============================
// LOGIN / SIGNUP FORM
// ===============================

const authForm = $("#authForm");

if (authForm) {

  authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
      authForm.querySelector('[name="email"]')
        ?.value
        .trim();

    const password =
      authForm.querySelector('[name="password"]')
        ?.value;

    if (!email || !password) {
      toast("Email and password required.");
      return;
    }

    try {

      if (authMode === "signup") {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        try {
          await sendEmailVerification(
            result.user
          );
        } catch (error) {
          console.log(
            "Verification email:",
            error
          );
        }

        await setDoc(
          doc(
            db,
            "users",
            result.user.uid
          ),
          {
            email,
            name: "",
            role: "Freelancer",
            area: "Guwahati",
            skills: "",
            about: "",
            contact: "",
            createdAt: serverTimestamp()
          },
          { merge: true }
        );

        toast("Account created successfully.");

      } else {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        toast("Login successful.");
      }

      closeM("authModal");

      authForm.reset();

    } catch (error) {

      console.error(
        "AUTH ERROR:",
        error
      );

      let message =
        "Login failed.";

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Email or password is incorrect.";
      }

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "This email is already registered.";
      }

      if (
        error.code ===
        "auth/weak-password"
      ) {
        message =
          "Password must be at least 6 characters.";
      }

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        message =
          "Enter a valid email.";
      }

      if (
        error.code ===
        "auth/api-key-not-valid"
      ) {
        message =
          "Firebase API key is invalid.";
      }

      if (
        error.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network connection problem.";
      }

      toast(message);
    }
  });
}


// ===============================
// FORGOT PASSWORD
// ===============================

const forgotPassword =
  $("#forgotPassword");

if (forgotPassword) {

  forgotPassword.addEventListener(
    "click",
    async () => {

      const email =
        prompt(
          "Enter your registered email:"
        );

      if (!email) return;

      try {

        await sendPasswordResetEmail(
          auth,
          email
        );

        toast(
          "Password reset email sent."
        );

      } catch (error) {

        console.error(error);

        toast(
          "Could not send reset email."
        );
      }
    }
  );
}


// ===============================
// LOGOUT
// ===============================

const logoutButton =
  $("#logoutButton");

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        toast("Logged out.");

      } catch (error) {

        console.error(error);

        toast("Logout failed.");
      }
    }
  );
}


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    const authButton =
      $("#authButton");

    const profileButton =
      $("#profileButton");

    const mobileProfile =
      $("#mobileProfile");

    const chatsNav =
      $("#chatsNav");

    const mobileChats =
      $("#mobileChats");

    if (user) {

      if (authButton) {
        authButton.textContent =
          "My Account";
      }

      if (profileButton) {
        profileButton.style.display =
          "inline-block";
      }

      if (mobileProfile) {
        mobileProfile.style.display =
          "block";
      }

      if (chatsNav) {
        chatsNav.style.display =
          "inline-block";
      }

      if (mobileChats) {
        mobileChats.style.display =
          "block";
      }

      await loadProfile();

    } else {

      if (authButton) {
        authButton.textContent =
          "Login / Sign up";
      }

      if (profileButton) {
        profileButton.style.display =
          "none";
      }

      if (mobileProfile) {
        mobileProfile.style.display =
          "none";
      }

      if (chatsNav) {
        chatsNav.style.display =
          "none";
      }

      if (mobileChats) {
        mobileChats.style.display =
          "none";
      }
    }

    await loadJobs();
  }
);


// ===============================
// LOGIN BUTTON
// ===============================

const authButton =
  $("#authButton");

if (authButton) {

  authButton.addEventListener(
    "click",
    () => {

      if (currentUser) {

        openM("profileModal");

      } else {

        setAuthMode("login");

        openM("authModal");
      }
    }
  );
}


// ===============================
// PROFILE
// ===============================

async function loadProfile() {

  if (!currentUser) return;

  try {

    const profileRef =
      doc(
        db,
        "users",
        currentUser.uid
      );

    const snapshot =
      await getDoc(profileRef);

    if (!snapshot.exists()) {
      return;
    }

    currentProfile =
      snapshot.data();

    const form =
      $("#profileForm");

    if (!form) return;

    Object.entries(
      currentProfile
    ).forEach(([key, value]) => {

      const input =
        form.querySelector(
          `[name="${key}"]`
        );

      if (
        input &&
        value !== null &&
        value !== undefined
      ) {
        input.value = value;
      }
    });

  } catch (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );
  }
}


const profileForm =
  $("#profileForm");

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!currentUser) {

        setAuthMode("login");
        openM("authModal");

        return;
      }

      const data =
        Object.fromEntries(
          new FormData(profileForm)
        );

      try {

        await setDoc(
          doc(
            db,
            "users",
            currentUser.uid
          ),
          {
            ...data,
            email:
              currentUser.email,
            updatedAt:
              serverTimestamp()
          },
          { merge: true }
        );

        currentProfile = data;

        closeM("profileModal");

        toast(
          "Profile saved."
        );

      } catch (error) {

        console.error(error);

        toast(
          "Profile save failed."
        );
      }
    }
  );
}


// ===============================
// JOBS
// ===============================

let jobs = [];

async function loadJobs() {

  try {

    const q =
      query(
        collection(db, "jobs"),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(q);

    jobs =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data()
        })
      );

    renderJobs();

  } catch (error) {

    console.error(
      "JOB ERROR:",
      error
    );

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "jobs"
          )
        );

      jobs =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      renderJobs();

    } catch (secondError) {

      console.error(
        secondError
      );
    }
  }
}


function renderJobs() {

  const grid =
    $("#jobsGrid");

  if (!grid) return;

  const search =
    (
      $("#search")?.value ||
      ""
    )
      .toLowerCase()
      .trim();

  const area =
    $("#area")?.value ||
    "";

  const category =
    $("#category")?.value ||
    "";

  const sort =
    $("#sort")?.value ||
    "new";

  let list =
    jobs.filter((job) => {

      const text =
        `
        ${job.title || ""}
        ${job.description || ""}
        ${job.category || ""}
        ${job.area || ""}
        `
          .toLowerCase();

      return (
        (!search ||
          text.includes(search)) &&
        (!area ||
          job.area === area) &&
        (!category ||
          job.category === category)
      );
    });


  if (sort === "budget") {

    list.sort(
      (a, b) =>
        Number(b.budget || 0) -
        Number(a.budget || 0)
    );
  }


  grid.innerHTML =
    list.map((job) => {

      const budget =
        Number(
          job.budget || 0
        ).toLocaleString(
          "en-IN"
        );

      const isOwner =
        currentUser &&
        job.ownerId ===
          currentUser.uid;

      return `
        <article class="job">

          <div class="jobtop">

            <span class="tag">
              ${esc(
                job.category ||
                "Other"
              )}
            </span>

            <span class="budget">
              ₹${budget}
            </span>

          </div>

          <h3>
            ${esc(
              job.title ||
              "Untitled job"
            )}
          </h3>

          <div class="desc">
            ${esc(
              job.description ||
              ""
            )}
          </div>

          <div class="meta">
            📍 ${esc(
              job.area ||
              "Local"
            )}
          </div>

          <div class="job-actions">

            ${
              isOwner
                ? `
                  <button
                    class="contact"
                    onclick="viewApplications('${job.id}')"
                  >
                    Applications
                  </button>
                `
                : `
                  <button
                    class="contact"
                    onclick="applyToJob('${job.id}')"
                  >
                    Apply for Job
                  </button>

                  <button
                    class="contact"
                    onclick="chatFromJob(
                      '${job.id}',
                      '${encodeURIComponent(
                        job.title || ""
                      )}',
                      '${job.ownerId || ""}'
                    )"
                  >
                    Chat
                  </button>
                `
            }

          </div>

        </article>
      `;

    }).join("");


  const empty =
    $("#empty");

  if (empty) {

    empty.classList.toggle(
      "hidden",
      list.length > 0
    );
  }


  const count =
    $("#jobCount");

  if (count) {
    count.textContent =
      jobs.length;
  }
}


// ===============================
// FILTERS
// ===============================

[
  "search",
  "area",
  "category",
  "sort"
].forEach((id) => {

  const element =
    $("#" + id);

  if (!element) return;

  element.addEventListener(
    "input",
    renderJobs
  );

  element.addEventListener(
    "change",
    renderJobs
  );
});


// ===============================
// CATEGORY BUTTONS
// ===============================

document
  .querySelectorAll(
    "[data-cat]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const category =
          $("#category");

        if (category) {
          category.value =
            button.dataset.cat;
        }

        renderJobs();

        document
          .getElementById("jobs")
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }
    );
  });


// ===============================
// POST JOB
// ===============================

const jobForm =
  $("#jobForm");

if (jobForm) {

  jobForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!currentUser) {

        setAuthMode("login");
        openM("authModal");

        toast(
          "Login first to post a job."
        );

        return;
      }

      const data =
        Object.fromEntries(
          new FormData(jobForm)
        );

      data.budget =
        Number(
          data.budget || 0
        );

      data.ownerId =
        currentUser.uid;

      data.ownerEmail =
        currentUser.email;

      data.createdAt =
        serverTimestamp();

      try {

        await addDoc(
          collection(
            db,
            "jobs"
          ),
          data
        );

        jobForm.reset();

        closeM("postModal");

        toast(
          "Job published successfully."
        );

        await loadJobs();

      } catch (error) {

        console.error(error);

        toast(
          "Unable to publish job."
        );
      }
    }
  );
}


// ===============================
// APPLY
// ===============================

window.applyToJob =
  async function(jobId) {

    if (!currentUser) {

      setAuthMode("login");
      openM("authModal");

      toast(
        "Login first to apply."
      );

      return;
    }

    const job =
      jobs.find(
        (item) =>
          item.id === jobId
      );

    if (!job) {

      toast(
        "Job not found."
      );

      return;
    }

    if (
      job.ownerId ===
      currentUser.uid
    ) {

      toast(
        "You cannot apply to your own job."
      );

      return;
    }

    try {

      const q =
        query(
          collection(
            db,
            "applications"
          ),
          where(
            "jobId",
            "==",
            jobId
          ),
          where(
            "applicantId",
            "==",
            currentUser.uid
          )
        );

      const existing =
        await getDocs(q);

      if (!existing.empty) {

        toast(
          "You already applied."
        );

        return;
      }

      await addDoc(
        collection(
          db,
          "applications"
        ),
        {
          jobId,
          jobTitle:
            job.title || "",
          jobOwnerId:
            job.ownerId,
          applicantId:
            currentUser.uid,
          applicantEmail:
            currentUser.email,
          status:
            "pending",
          createdAt:
            serverTimestamp()
        }
      );

      toast(
        "Application sent."
      );

    } catch (error) {

      console.error(error);

      toast(
        "Application failed."
      );
    }
  };


// ===============================
// APPLICATIONS
// ===============================

window.viewApplications =
  async function(jobId) {

    if (!currentUser) {
      setAuthMode("login");
      openM("authModal");
      return;
    }

    const job =
      jobs.find(
        (item) =>
          item.id === jobId
      );

    if (!job) return;

    if (
      job.ownerId !==
      currentUser.uid
    ) {

      toast(
        "Only the client can view applications."
      );

      return;
    }

    const list =
      $("#applicationsList");

    if (!list) return;

    try {

      const q =
        query(
          collection(
            db,
            "applications"
          ),
          where(
            "jobId",
            "==",
            jobId
          )
        );

      const snapshot =
        await getDocs(q);

      if (snapshot.empty) {

        list.innerHTML =
          "<p>No applications yet.</p>";

      } else {

        list.innerHTML =
          snapshot.docs
            .map((item) => {

              const application =
                item.data();

              return `
                <div class="application-card">

                  <h3>
                    ${esc(
                      application
                        .applicantEmail ||
                      "Applicant"
                    )}
                  </h3>

                  <p>
                    Status:
                    ${esc(
                      application.status ||
                      "pending"
                    )}
                  </p>

                  <button
                    class="contact"
                    onclick="chatFromJob(
                      '${jobId}',
                      '${encodeURIComponent(
                        job.title || ""
                      )}',
                      '${application.applicantId}'
                    )"
                  >
                    Chat
                  </button>

                </div>
              `;

            })
            .join("");
      }

      openM(
        "applicationsModal"
      );

    } catch (error) {

      console.error(error);

      toast(
        "Unable to load applications."
      );
    }
  };


// ===============================
// CHAT
// ===============================

async function ensureChat(
  jobId,
  title,
  otherUserId
) {

  if (!currentUser) {
    return null;
  }

  if (!otherUserId) {

    toast(
      "User information unavailable."
    );

    return null;
  }

  if (
    otherUserId ===
    currentUser.uid
  ) {

    toast(
      "You cannot chat with yourself."
    );

    return null;
  }

  const participants =
    [
      currentUser.uid,
      otherUserId
    ].sort();

  const chatId =
    `${jobId}_${participants[0]}_${participants[1]}`;

  const chatRef =
    doc(
      db,
      "chats",
      chatId
    );

  const snapshot =
    await getDoc(chatRef);

  if (!snapshot.exists()) {

    await setDoc(
      chatRef,
      {
        jobId,
        jobTitle:
          title || "Job",
        participants,
        lastMessage: "",
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp()
      }
    );
  }

  return chatId;
}


// ===============================
// OPEN CHAT FROM JOB
// ===============================

window.chatFromJob =
  async function(
    jobId,
    titleEncoded,
    otherUserId
  ) {

    if (!currentUser) {

      setAuthMode("login");
      openM("authModal");

      toast(
        "Login first to chat."
      );

      return;
    }

    const title =
      decodeURIComponent(
        titleEncoded || ""
      );

    const chatId =
      await ensureChat(
        jobId,
        title,
        otherUserId
      );

    if (!chatId) return;

    await openChat(
      chatId,
      title
    );
  };


// ===============================
// OPEN CHAT
// ===============================

async function openChat(
  chatId,
  title
) {

  if (!currentUser) return;

  const titleElement =
    $("#chatTitle");

  if (titleElement) {
    titleElement.textContent =
      title || "Chat";
  }

  openM("chatModal");

  const messages =
    $("#messages");

  if (!messages) return;

  if (
    window.chatUnsubscribe
  ) {
    window.chatUnsubscribe();
  }

  const q =
    query(
      collection(
        db,
        "chats",
        chatId,
        "messages"
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );

  window.chatUnsubscribe =
    onSnapshot(
      q,
      (snapshot) => {

        messages.innerHTML =
          snapshot.docs
            .map((item) => {

              const message =
                item.data();

              const mine =
                message.senderId ===
                currentUser.uid;

              return `
                <div class="chat-message ${
                  mine
                    ? "mine"
                    : "other"
                }">
                  ${esc(
                    message.text || ""
                  )}
                </div>
              `;

            })
            .join("");

        messages.scrollTop =
          messages.scrollHeight;
      },
      (error) => {

        console.error(
          "CHAT ERROR:",
          error
        );

        toast(
          "Unable to load chat."
        );
      }
    );


  const messageForm =
    $("#messageForm");

  if (!messageForm) return;

  messageForm.onsubmit =
    async (event) => {

      event.preventDefault();

      const input =
        messageForm.querySelector(
          '[name="message"]'
        );

      if (!input) return;

      const text =
        input.value.trim();

      if (!text) return;

      try {

        await addDoc(
          collection(
            db,
            "chats",
            chatId,
            "messages"
          ),
          {
            senderId:
              currentUser.uid,
            senderEmail:
              currentUser.email,
            text,
            createdAt:
              serverTimestamp()
          }
        );

        await setDoc(
          doc(
            db,
            "chats",
            chatId
          ),
          {
            lastMessage:
              text,
            updatedAt:
              serverTimestamp()
          },
          {
            merge: true
          }
        );

        input.value = "";

      } catch (error) {

        console.error(error);

        toast(
          "Message failed."
        );
      }
    };
}


// ===============================
// MY CHATS
// ===============================

async function loadChats() {

  if (!currentUser) return;

  const list =
    $("#chatList");

  if (!list) return;

  try {

    const q =
      query(
        collection(
          db,
          "chats"
        ),
        where(
          "participants",
          "array-contains",
          currentUser.uid
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      list.innerHTML =
        "<p>No chats yet.</p>";

      return;
    }

    list.innerHTML =
      snapshot.docs
        .map((item) => {

          const chat =
            item.data();

          return `
            <div class="chat-card">

              <h3>
                ${esc(
                  chat.jobTitle ||
                  "LocalWork Chat"
                )}
              </h3>

              <p>
                ${esc(
                  chat.lastMessage ||
                  "No messages yet"
                )}
              </p>

              <button
                class="contact"
                onclick="openChat(
                  '${item.id}',
                  '${encodeURIComponent(
                    chat.jobTitle ||
                    "Chat"
                  )}'
                )"
              >
                Open Chat
              </button>

            </div>
          `;

        })
        .join("");

  } catch (error) {

    console.error(error);

    toast(
      "Unable to load chats."
    );
  }
}


// ===============================
// CHATS BUTTON
// ===============================

const chatsNav =
  $("#chatsNav");

const mobileChats =
  $("#mobileChats");

async function chatsClick() {

  if (!currentUser) {

    setAuthMode("login");
    openM("authModal");

    toast(
      "Login first."
    );

    return;
  }

  await loadChats();

  openM(
    "chatsModal"
  );
}

if (chatsNav) {
  chatsNav.addEventListener(
    "click",
    chatsClick
  );
}

if (mobileChats) {
  mobileChats.addEventListener(
    "click",
    chatsClick
  );
}


// ===============================
// SCROLL
// ===============================

document
  .querySelectorAll(
    "[data-scroll]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const target =
          document.getElementById(
            button.dataset.scroll
          );

        if (target) {

          target.scrollIntoView({
            behavior:
              "smooth"
          });
        }
      }
    );
  });


// ===============================
// YEAR
// ===============================

const year =
  $("#year");

if (year) {
  year.textContent =
    new Date().getFullYear();
}


// ===============================
// START
// ===============================

setAuthMode("login");

console.log(
  "LocalWork V4 loaded."
);
