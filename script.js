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
  arrayUnion,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ===============================
// FIREBASE CONFIG
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBIjUIplpwSGsZK8WzEeNYMgH8qG3tamyek",
  authDomain: "localwork-f6460.firebaseapp.com",
  projectId: "localwork-f6460",
  storageBucket: "localwork-f6460.firebasestorage.app",
  messagingSenderId: "738787718967",
  appId: "1:738787718967:web:1c5abb9d77528c8b854cb2"
};


// ===============================
// INITIALIZE FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================
// HELPERS
// ===============================

const $ = (selector) => document.querySelector(selector);

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function toast(message) {
  const el = $("#toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}


// ===============================
// MODALS
// ===============================

function openM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

function closeM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openM(button.dataset.open);
  });
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    if (modal) modal.classList.remove("open");
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });
});


// ===============================
// MOBILE MENU
// ===============================

const mobileMenuButton = $("#mobileMenuBtn");
const mobileMenu = $("#mobileMenu");

if (mobileMenuButton && mobileMenu) {
  mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
  });
}


// ===============================
// AUTH UI
// ===============================

let authMode = "login";
let currentUser = null;
let currentProfile = null;

function setAuthMode(mode) {
  authMode = mode;

  const title = $("#authTitle");
  const switchText = $("#authSwitch");
  const button = $("#authSubmit");

  if (title) {
    title.textContent =
      mode === "login" ? "Welcome back" : "Create your account";
  }

  if (button) {
    button.textContent =
      mode === "login" ? "Login" : "Create account";
  }

  if (switchText) {
    switchText.textContent =
      mode === "login"
        ? "Don't have an account? Sign up"
        : "Already have an account? Login";
  }
}

function toggleAuth() {
  setAuthMode(authMode === "login" ? "signup" : "login");
}

window.toggleAuth = toggleAuth;

const authSwitch = $("#authSwitch");

if (authSwitch) {
  authSwitch.addEventListener("click", toggleAuth);
}


// ===============================
// AUTH FORM
// ===============================

const authForm = $("#authForm");

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = authForm.querySelector('[name="email"]');
    const passwordInput = authForm.querySelector('[name="password"]');

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      toast("Email and password required.");
      return;
    }

    try {
      if (authMode === "signup") {

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        try {
          await sendEmailVerification(result.user);
        } catch (verificationError) {
          console.log("Verification email error:", verificationError);
        }

        await setDoc(
          doc(db, "users", result.user.uid),
          {
            email: email,
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

      console.error(error);

      let message = "Something went wrong.";

      if (error.code === "auth/invalid-credential") {
        message = "Email or password is incorrect.";
      }

      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      }

      if (error.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      }

      if (error.code === "auth/invalid-email") {
        message = "Enter a valid email.";
      }

      if (error.code === "auth/api-key-not-valid") {
        message = "Firebase API key problem.";
      }

      toast(message);
    }
  });
}


// ===============================
// FORGOT PASSWORD
// ===============================

const forgotPassword = $("#forgotPassword");

if (forgotPassword) {
  forgotPassword.addEventListener("click", async () => {

    const email = prompt("Enter your registered email:");

    if (!email) return;

    try {

      await sendPasswordResetEmail(auth, email);

      toast("Password reset email sent.");

    } catch (error) {

      console.error(error);

      toast("Unable to send reset email.");
    }
  });
}


// ===============================
// LOGOUT
// ===============================

const logoutButton = $("#logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {

    try {

      await signOut(auth);

      toast("Logged out.");

    } catch (error) {

      console.error(error);

      toast("Logout failed.");
    }
  });
}


// ===============================
// PROFILE
// ===============================

async function loadProfile() {

  if (!currentUser) return;

  try {

    const profileRef = doc(
      db,
      "users",
      currentUser.uid
    );

    const snap = await getDoc(profileRef);

    if (snap.exists()) {

      currentProfile = snap.data();

      const form = $("#profileForm");

      if (form) {

        Object.entries(currentProfile).forEach(([key, value]) => {

          const input = form.querySelector(
            `[name="${key}"]`
          );

          if (input && value != null) {
            input.value = value;
          }

        });

      }
    }

  } catch (error) {

    console.error("Profile error:", error);
  }
}


// ===============================
// PROFILE FORM
// ===============================

const profileForm = $("#profileForm");

if (profileForm) {

  profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {

      setAuthMode("login");
      openM("authModal");

      toast("Login first.");

      return;
    }

    const data = Object.fromEntries(
      new FormData(profileForm)
    );

    try {

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          ...data,
          email: currentUser.email,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      currentProfile = data;

      closeM("profileModal");

      toast("Profile saved.");

    } catch (error) {

      console.error(error);

      toast("Profile save failed.");
    }
  });
}


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  const authButton = $("#authButton");
  const logoutBtn = $("#logoutButton");
  const profileButton = $("#profileButton");
  const mobileProfile = $("#mobileProfile");

  if (user) {

    if (authButton) {
      authButton.textContent = "Account";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }

    if (profileButton) {
      profileButton.style.display = "inline-block";
    }

    if (mobileProfile) {
      mobileProfile.style.display = "block";
    }

    await loadProfile();

  } else {

    if (authButton) {
      authButton.textContent = "Login / Sign up";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }

    if (profileButton) {
      profileButton.style.display = "none";
    }

    if (mobileProfile) {
      mobileProfile.style.display = "none";
    }
  }

  await loadJobs();
});


// ===============================
// AUTH BUTTON
// ===============================

const authButton = $("#authButton");

if (authButton) {

  authButton.addEventListener("click", () => {

    if (currentUser) {

      openM("profileModal");

    } else {

      setAuthMode("login");
      openM("authModal");
    }

  });
}


// ===============================
// JOBS
// ===============================

let jobs = [];

async function loadJobs() {

  try {

    const jobsQuery = query(
      collection(db, "jobs"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(jobsQuery);

    jobs = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    render();

  } catch (error) {

    console.error("Jobs loading error:", error);

    // fallback query if createdAt ordering fails
    try {

      const snapshot = await getDocs(
        collection(db, "jobs")
      );

      jobs = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      render();

    } catch (secondError) {

      console.error(secondError);

      toast("Unable to load jobs.");
    }
  }
}


// ===============================
// RENDER JOBS
// ===============================

function render() {

  const grid = $("#jobsGrid");

  if (!grid) return;

  const search = ($("#search")?.value || "")
    .toLowerCase()
    .trim();

  const area = $("#area")?.value || "";

  const category = $("#category")?.value || "";

  const sort = $("#sort")?.value || "new";

  let list = jobs.filter((job) => {

    const text = `
      ${job.title || ""}
      ${job.description || ""}
      ${job.category || ""}
      ${job.area || ""}
    `.toLowerCase();

    return (
      (!search || text.includes(search)) &&
      (!area || job.area === area) &&
      (!category || job.category === category)
    );
  });


  if (sort === "budget") {

    list.sort(
      (a, b) =>
        Number(b.budget || 0) -
        Number(a.budget || 0)
    );

  }


  grid.innerHTML = list.map((job) => {

    const budget = Number(
      job.budget || 0
    ).toLocaleString("en-IN");

    return `
      <article class="job">

        <div class="jobtop">

          <span class="tag">
            ${esc(job.category || "Other")}
          </span>

          <span class="budget">
            ₹${budget}
          </span>

        </div>

        <h3>
          ${esc(job.title || "Untitled job")}
        </h3>

        <div class="desc">
          ${esc(job.description || "")}
        </div>

        <div class="meta">
          📍 ${esc(job.area || "Local")}
        </div>

        <div class="job-actions">

          <button
            class="contact"
            onclick="applyToJob('${job.id}')"
          >
            Apply for Job
          </button>

          ${
            currentUser &&
            job.ownerId === currentUser.uid
              ? `
                <button
                  class="contact"
                  onclick="viewApplications('${job.id}')"
                >
                  View Applications
                </button>
              `
              : `
                <button
                  class="contact"
                  onclick="chatFromJob(
                    '${job.id}',
                    '${encodeURIComponent(job.title || "")}',
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


  const empty = $("#empty");

  if (empty) {
    empty.classList.toggle(
      "hidden",
      list.length > 0
    );
  }


  const jobCount = $("#jobCount");

  if (jobCount) {
    jobCount.textContent = jobs.length;
  }

}


// ===============================
// SEARCH / FILTER
// ===============================

[
  "search",
  "area",
  "category",
  "sort"
].forEach((id) => {

  const element = $("#" + id);

  if (element) {
    element.addEventListener(
      "input",
      render
    );

    element.addEventListener(
      "change",
      render
    );
  }

});


// ===============================
// CATEGORY BUTTONS
// ===============================

document.querySelectorAll("[data-cat]").forEach((button) => {

  button.addEventListener("click", () => {

    const category = $("#category");

    if (category) {
      category.value = button.dataset.cat;
    }

    render();

    document
      .getElementById("jobs")
      ?.scrollIntoView({
        behavior: "smooth"
      });
  });

});


// ===============================
// POST JOB
// ===============================

const jobForm = $("#jobForm");

if (jobForm) {

  jobForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {

      setAuthMode("login");
      openM("authModal");

      toast("Login first to post a job.");

      return;
    }


    const data = Object.fromEntries(
      new FormData(jobForm)
    );


    data.budget = Number(data.budget || 0);

    data.ownerId = currentUser.uid;

    data.ownerEmail = currentUser.email;

    data.createdAt = serverTimestamp();


    try {

      await addDoc(
        collection(db, "jobs"),
        data
      );

      jobForm.reset();

      closeM("postModal");

      toast("Job published successfully.");

      await loadJobs();

    } catch (error) {

      console.error(error);

      toast("Unable to publish job.");
    }

  });

}


// ===============================
// CONTACT CLIENT
// ===============================

window.contactJob = async (jobId) => {

  const job = jobs.find(
    (item) => item.id === jobId
  );

  if (!job) return;

  if (!currentUser) {

    setAuthMode("login");
    openM("authModal");

    toast("Login first.");

    return;
  }

  if (!job.ownerId) {

    toast("Client information unavailable.");

    return;
  }

  if (job.ownerId === currentUser.uid) {

    toast("This is your own job.");

    return;
  }

  await ensureChat(
    job.id,
    job.title || "Job",
    job.ownerId
  );
};


// ===============================
// APPLY FOR JOB
// ===============================

window.applyToJob = async (jobId) => {

  if (!currentUser) {

    setAuthMode("login");
    openM("authModal");

    toast("Login first to apply.");

    return;
  }


  const job = jobs.find(
    (item) => item.id === jobId
  );

  if (!job) {

    toast("Job not found.");

    return;
  }


  if (job.ownerId === currentUser.uid) {

    toast("You cannot apply to your own job.");

    return;
  }


  try {

    const existingQuery = query(
      collection(db, "applications"),
      where("jobId", "==", jobId),
      where("applicantId", "==", currentUser.uid)
    );

    const existing = await getDocs(
      existingQuery
    );


    if (!existing.empty) {

      toast("You already applied for this job.");

      return;
    }


    await addDoc(
      collection(db, "applications"),
      {
        jobId: jobId,
        jobTitle: job.title || "",
        jobOwnerId: job.ownerId,
        applicantId: currentUser.uid,
        applicantEmail: currentUser.email,
        status: "pending",
        createdAt: serverTimestamp()
      }
    );


    toast("Application sent successfully.");

    await ensureChat(
      jobId,
      job.title || "Job",
      job.ownerId
    );

  } catch (error) {

    console.error(error);

    toast("Application failed.");
  }

};


// ===============================
// VIEW APPLICATIONS
// ===============================

window.viewApplications = async (jobId) => {

  if (!currentUser) {

    setAuthMode("login");
    openM("authModal");

    return;
  }


  const job = jobs.find(
    (item) => item.id === jobId
  );


  if (!job) return;


  if (job.ownerId !== currentUser.uid) {

    toast("Only the client can view applications.");

    return;
  }


  const listElement =
    $("#applicationsList") ||
    $("#applicationList");


  try {

    const q = query(
      collection(db, "applications"),
      where("jobId", "==", jobId)
    );


    const snapshot = await getDocs(q);


    if (listElement) {

      if (snapshot.empty) {

        listElement.innerHTML =
          "<p>No applications yet.</p>";

      } else {

        listElement.innerHTML =
          snapshot.docs.map((item) => {

            const application = item.data();

            return `
              <div class="application-card">

                <h3>
                  ${esc(
                    application.applicantEmail ||
                    "Applicant"
                  )}
                </h3>

                <p>
                  Status:
                  <strong>
                    ${esc(application.status || "pending")}
                  </strong>
                </p>

                <button
                  class="contact"
                  onclick="chatFromJob(
                    '${jobId}',
                    '${encodeURIComponent(job.title || "")}',
                    '${application.applicantId}'
                  )"
                >
                  Chat with applicant
                </button>

              </div>
            `;

          }).join("");
      }
    }


    openM("applicationsModal");

  } catch (error) {

    console.error(error);

    toast("Unable to load applications.");
  }

};


// ===============================
// CREATE / GET CHAT
// ===============================

async function ensureChat(
  jobId,
  title,
  otherUserId
) {

  if (!currentUser) return null;

  if (!otherUserId) {

    toast("User information unavailable.");

    return null;
  }


  if (otherUserId === currentUser.uid) {

    toast("You cannot chat with yourself.");

    return null;
  }


  const participants = [
    currentUser.uid,
    otherUserId
  ].sort();


  const chatId =
    `${jobId}_${participants[0]}_${participants[1]}`;


  const chatRef = doc(
    db,
    "chats",
    chatId
  );


  const snap = await getDoc(chatRef);


  if (!snap.exists()) {

    await setDoc(
      chatRef,
      {
        jobId: jobId,
        jobTitle: title,
        participants: participants,
        lastMessage: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

  }


  return chatId;
}


// ===============================
// CHAT FROM JOB
// ===============================

window.chatFromJob = async (
  jobId,
  titleEncoded,
  otherUserId
) => {

  if (!currentUser) {

    setAuthMode("login");
    openM("authModal");

    toast("Login first to chat.");

    return;
  }


  const title =
    decodeURIComponent(titleEncoded || "");


  const chatId = await ensureChat(
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


  const chatTitle =
    $("#chatTitle");

  if (chatTitle) {
    chatTitle.textContent =
      title || "Chat";
  }


  openM("chatModal");


  const messagesElement =
    $("#messages") ||
    $("#chatMessages");


  if (!messagesElement) return;


  const messagesQuery = query(
    collection(
      db,
      "chats",
      chatId,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );


  if (window.__chatUnsubscribe) {
    window.__chatUnsubscribe();
  }


  window.__chatUnsubscribe =
    onSnapshot(
      messagesQuery,
      (snapshot) => {

        messagesElement.innerHTML =
          snapshot.docs.map((item) => {

            const message = item.data();

            const mine =
              message.senderId ===
              currentUser.uid;


            return `
              <div
                class="chat-message ${
                  mine ? "mine" : "other"
                }"
              >
                ${esc(message.text || "")}
              </div>
            `;

          }).join("");


        messagesElement.scrollTop =
          messagesElement.scrollHeight;

      },
      (error) => {

        console.error(
          "Chat listener error:",
          error
        );

        toast("Unable to load messages.");
      }
    );


  const messageForm =
    $("#messageForm") ||
    $("#chatForm");


  if (messageForm) {

    messageForm.onsubmit =
      async (e) => {

        e.preventDefault();


        const input =
          messageForm.querySelector(
            '[name="message"]'
          ) ||
          $("#messageInput");


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
              senderId: currentUser.uid,
              senderEmail: currentUser.email,
              text: text,
              createdAt: serverTimestamp()
            }
          );


          await setDoc(
            doc(
              db,
              "chats",
              chatId
            ),
            {
              lastMessage: text,
              updatedAt: serverTimestamp()
            },
            {
              merge: true
            }
          );


          input.value = "";

        } catch (error) {

          console.error(error);

          toast("Message failed to send.");
        }

      };

  }

}


window.openChat = openChat;


// ===============================
// MY CHATS
// ===============================

async function loadChats() {

  if (!currentUser) return;


  const chatList =
    $("#chatList") ||
    $("#chatsList");


  if (!chatList) return;


  try {

    const q = query(
      collection(db, "chats"),
      where(
        "participants",
        "array-contains",
        currentUser.uid
      )
    );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      chatList.innerHTML =
        "<p>No chats yet.</p>";

      return;
    }


    chatList.innerHTML =
      snapshot.docs.map((item) => {

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
                  chat.jobTitle || "Chat"
                )}'
              )"
            >
              Open Chat
            </button>

          </div>
        `;

      }).join("");


  } catch (error) {

    console.error(error);

    toast("Unable to load chats.");
  }

}


const chatsButton = $("#chatsButton");

if (chatsButton) {

  chatsButton.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        setAuthMode("login");
        openM("authModal");

        toast("Login first.");

        return;
      }

      await loadChats();

      openM("chatsModal");

    }
  );

}


// ===============================
// SCROLL BUTTONS
// ===============================

document.querySelectorAll(
  "[data-scroll]"
).forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const target =
        document.getElementById(
          button.dataset.scroll
        );

      if (target) {

        target.scrollIntoView({
          behavior: "smooth"
        });

      }

    }
  );

});


// ===============================
// YEAR
// ===============================

const year = $("#year");

if (year) {
  year.textContent =
    new Date().getFullYear();
}


// ===============================
// START
// ===============================

setAuthMode("login");

console.log(
  "LocalWork Firebase V4 loaded successfully."
);
