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

const $$ = (selector) =>
  document.querySelectorAll(selector);

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

function safeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function toast(message, title = "LocalWork") {

  const toastBox = $("#toast");

  if (!toastBox) {
    alert(message);
    return;
  }

  const titleEl = $("#toastTitle");
  const textEl = $("#toastText");
  const iconEl = $("#toastIcon");

  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = message;
  if (iconEl) iconEl.textContent = "✓";

  toastBox.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toastBox.classList.remove("show");
  }, 3000);
}

function openModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }
}

function closeModal(id) {

  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("open");
  }

  if (!document.querySelector(".modal.open")) {
    document.body.classList.remove("modal-open");
  }
}

function closeAllModals() {

  $$(".modal.open").forEach((modal) => {
    modal.classList.remove("open");
  });

  document.body.classList.remove("modal-open");
}

function getField(form, name) {

  if (!form) return "";

  const field = form.querySelector(
    `[name="${name}"]`
  );

  return field ? field.value.trim() : "";
}


// =====================================================
// GLOBAL STATE
// =====================================================

let currentUser = null;
let currentProfile = {};
let jobs = [];
let authMode = "login";

window.chatUnsubscribe = null;
window.currentChatId = null;
window.currentChatUserId = null;
window.currentChatJobId = null;


// =====================================================
// MODALS
// =====================================================

$$("[data-close]").forEach((button) => {

  button.addEventListener("click", () => {

    const modal = button.closest(".modal");

    if (modal) {
      modal.classList.remove("open");
    }

    if (!document.querySelector(".modal.open")) {
      document.body.classList.remove("modal-open");
    }

  });

});


$$(".modal").forEach((modal) => {

  modal.addEventListener("click", (event) => {

    if (event.target === modal) {
      modal.classList.remove("open");

      if (!document.querySelector(".modal.open")) {
        document.body.classList.remove("modal-open");
      }
    }

  });

});


// =====================================================
// MOBILE MENU
// =====================================================

const mobileMenuBtn = $("#mobileMenuBtn");
const mobileNav = $("#mobileNav");

if (mobileMenuBtn && mobileNav) {

  mobileMenuBtn.addEventListener("click", () => {

    mobileNav.classList.toggle("open");

  });

}


// =====================================================
// MOBILE NAV CLOSE
// =====================================================

$$(
  "#mNavJobs,#mNavPost,#mNavChats,#mNavAccount"
).forEach((button) => {

  button.addEventListener("click", () => {

    if (mobileNav) {
      mobileNav.classList.remove("open");
    }

  });

});


// =====================================================
// AUTH MODE
// =====================================================

function setAuthMode(mode) {

  authMode = mode;

  const loginTab = $("#loginTab");
  const signupTab = $("#signupTab");

  const nameField = $("#authName");
  const roleField = $("#authRole");

  const submit = $("#authSubmit");

  const message = $("#authMessage");

  if (loginTab) {
    loginTab.classList.toggle(
      "active",
      mode === "login"
    );
  }

  if (signupTab) {
    signupTab.classList.toggle(
      "active",
      mode === "signup"
    );
  }

  if (nameField) {
    nameField.style.display =
      mode === "signup"
        ? "block"
        : "none";
  }

  if (roleField) {
    roleField.style.display =
      mode === "signup"
        ? "block"
        : "none";
  }

  if (submit) {
    submit.textContent =
      mode === "login"
        ? "Login"
        : "Create Account";
  }

  if (message) {
    message.textContent = "";
  }

}

const loginTab = $("#loginTab");
const signupTab = $("#signupTab");

if (loginTab) {
  loginTab.addEventListener(
    "click",
    () => setAuthMode("login")
  );
}

if (signupTab) {
  signupTab.addEventListener(
    "click",
    () => setAuthMode("signup")
  );
}


// =====================================================
// OPEN AUTH
// =====================================================

function openLogin() {

  if (currentUser) {

    openModal("profileModal");

  } else {

    setAuthMode("login");
    openModal("authModal");

  }

}

const loginBtn = $("#loginBtn");

if (loginBtn) {
  loginBtn.addEventListener(
    "click",
    openLogin
  );
}


// =====================================================
// MOBILE ACCOUNT
// =====================================================

const mNavAccount = $("#mNavAccount");

if (mNavAccount) {

  mNavAccount.addEventListener(
    "click",
    openLogin
  );

}


// =====================================================
// AUTH FORM
// =====================================================

const authForm = $("#authForm");

if (authForm) {

  authForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        getField(
          authForm,
          "email"
        );

      const password =
        getField(
          authForm,
          "password"
        );

      const name =
        getField(
          authForm,
          "name"
        );

      const role =
        getField(
          authForm,
          "role"
        ) || "Freelancer";


      if (!email || !password) {

        toast(
          "Email and password required."
        );

        return;
      }


      if (
        authMode === "signup" &&
        password.length < 6
      ) {

        toast(
          "Password must be at least 6 characters."
        );

        return;
      }


      const submit =
        $("#authSubmit");

      if (submit) {
        submit.disabled = true;
        submit.textContent =
          authMode === "login"
            ? "Logging in..."
            : "Creating account...";
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

          } catch (verificationError) {

            console.log(
              "Verification email:",
              verificationError
            );

          }


          await setDoc(
            doc(
              db,
              "users",
              result.user.uid
            ),
            {
              uid:
                result.user.uid,

              email:
                email,

              name:
                name,

              role:
                role,

              area:
                "",

              skills:
                "",

              about:
                "",

              contact:
                "",

              createdAt:
                serverTimestamp()
            },
            {
              merge: true
            }
          );


          toast(
            "Account created successfully!",
            "Welcome to LocalWork"
          );

        } else {

          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );


          toast(
            "Login successful!",
            "Welcome back"
          );

        }


        authForm.reset();

        closeModal("authModal");


      } catch (error) {

        console.error(
          "AUTH ERROR:",
          error
        );

        let message =
          "Something went wrong.";


        switch (error.code) {

          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":

            message =
              "Email or password is incorrect.";

            break;


          case "auth/email-already-in-use":

            message =
              "This email is already registered.";

            break;


          case "auth/weak-password":

            message =
              "Password must be at least 6 characters.";

            break;


          case "auth/invalid-email":

            message =
              "Enter a valid email.";

            break;


          case "auth/api-key-not-valid":

            message =
              "Firebase API key is invalid.";

            break;


          case "auth/network-request-failed":

            message =
              "Network connection problem.";

            break;


          default:

            message =
              error.message ||
              "Authentication failed.";

        }


        toast(
          message,
          "Authentication"
        );


      } finally {

        if (submit) {

          submit.disabled = false;

          submit.textContent =
            authMode === "login"
              ? "Login"
              : "Create Account";

        }

      }

    }
  );

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

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
          email.trim()
        );

        toast(
          "Password reset email sent.",
          "Check your email"
        );

      } catch (error) {

        console.error(
          "RESET ERROR:",
          error
        );

        toast(
          "Unable to send reset email."
        );

      }

    }
  );

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    if (user) {

      await loadProfile();

      updateLoggedInUI();

    } else {

      currentProfile = {};

      updateLoggedOutUI();

    }

    await loadJobs();

  }
);


// =====================================================
// LOGGED IN UI
// =====================================================

function updateLoggedInUI() {

  const loginBtn =
    $("#loginBtn");

  if (loginBtn) {
    loginBtn.textContent =
      "My Account";
  }

  const navAccount =
    $("#navAccount");

  if (navAccount) {
    navAccount.style.display =
      "inline-flex";
  }

  const navChats =
    $("#navChats");

  if (navChats) {
    navChats.style.display =
      "inline-flex";
  }

  const mNavChats =
    $("#mNavChats");

  if (mNavChats) {
    mNavChats.style.display =
      "block";
  }

}


// =====================================================
// LOGGED OUT UI
// =====================================================

function updateLoggedOutUI() {

  const loginBtn =
    $("#loginBtn");

  if (loginBtn) {
    loginBtn.textContent =
      "Login";
  }

  const navChats =
    $("#navChats");

  if (navChats) {
    navChats.style.display =
      "none";
  }

  const navAccount =
    $("#navAccount");

  if (navAccount) {
    navAccount.style.display =
      "none";
  }

  const mNavChats =
    $("#mNavChats");

  if (mNavChats) {
    mNavChats.style.display =
      "none";
  }

}


// =====================================================
// PROFILE LOAD
// =====================================================

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


    if (snapshot.exists()) {

      currentProfile =
        snapshot.data();

    } else {

      currentProfile = {
        uid:
          currentUser.uid,

        email:
          currentUser.email || "",

        name:
          "",

        role:
          "Freelancer",

        area:
          "",

        skills:
          "",

        about:
          "",

        contact:
          ""
      };

    }


    fillProfileForm();


  } catch (error) {

    console.error(
      "PROFILE LOAD ERROR:",
      error
    );

  }

}


// =====================================================
// FILL PROFILE
// =====================================================

function fillProfileForm() {

  const fields = {

    name:
      currentProfile.name || "",

    role:
      currentProfile.role || "Freelancer",

    area:
      currentProfile.area || "",

    skills:
      currentProfile.skills || "",

    about:
      currentProfile.about || "",

    contact:
      currentProfile.contact || ""

  };


  const mapping = {

    name:
      "#profileNameInput",

    role:
      "#profileRoleInput",

    area:
      "#profileArea",

    skills:
      "#profileSkills",

    about:
      "#profileAbout",

    contact:
      "#profileContact"

  };


  Object.entries(fields).forEach(
    ([key, value]) => {

      const input =
        $(mapping[key]);

      if (input) {
        input.value = value;
      }

    }
  );

}


// =====================================================
// PROFILE FORM
// =====================================================

const profileForm =
  $("#profileForm");

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (!currentUser) {

        openLogin();

        return;

      }


      const data = {

        name:
          getField(
            profileForm,
            "name"
          ),

        role:
          getField(
            profileForm,
            "role"
          ),

        area:
          getField(
            profileForm,
            "area"
          ),

        skills:
          getField(
            profileForm,
            "skills"
          ),

        about:
          getField(
            profileForm,
            "about"
          ),

        contact:
          getField(
            profileForm,
            "contact"
          ),

        email:
          currentUser.email || "",

        updatedAt:
          serverTimestamp()

      };


      try {

        await setDoc(
          doc(
            db,
            "users",
            currentUser.uid
          ),
          data,
          {
            merge: true
          }
        );


        currentProfile = {
          ...currentProfile,
          ...data
        };


        closeModal(
          "profileModal"
        );


        toast(
          "Profile saved successfully!",
          "Profile"
        );


      } catch (error) {

        console.error(
          "PROFILE SAVE ERROR:",
          error
        );

        toast(
          "Profile save failed: " +
          (error.code || "unknown")
        );

      }

    }
  );

}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
  $("#logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        closeAllModals();

        toast(
          "Logged out successfully."
        );

      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

        toast(
          "Logout failed."
        );

      }

    }
  );

}


// =====================================================
// LOAD JOBS
// =====================================================

async function loadJobs() {

  try {

    let snapshot;


    try {

      const q =
        query(
          collection(
            db,
            "jobs"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

      snapshot =
        await getDocs(q);

    } catch (orderError) {

      console.warn(
        "Ordered jobs query failed. Using fallback.",
        orderError
      );

      snapshot =
        await getDocs(
          collection(
            db,
            "jobs"
          )
        );

    }


    jobs =
      snapshot.docs.map(
        (item) => ({
          id:
            item.id,

          ...item.data()
        })
      );


    jobs.sort(
      (a, b) => {

        const aTime =
          a.createdAt?.seconds || 0;

        const bTime =
          b.createdAt?.seconds || 0;

        return bTime - aTime;

      }
    );


    renderJobs();


  } catch (error) {

    console.error(
      "LOAD JOBS ERROR:",
      error
    );

    jobs = [];

    renderJobs();

    toast(
      "Unable to load jobs."
    );

  }

}


// =====================================================
// JOB FILTER STATE
// =====================================================

let activeCategory = "All";


// =====================================================
// RENDER JOBS
// =====================================================

function renderJobs() {

  const grid =
    $("#jobList");

  if (!grid) return;


  const search =
    (
      $("#searchInput")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const location =
    (
      $("#locationInput")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  let filtered =
    jobs.filter((job) => {

      const searchable =
        `
        ${job.title || ""}
        ${job.description || ""}
        ${job.category || ""}
        ${job.area || ""}
        ${job.contact || ""}
        `
          .toLowerCase();


      const matchesSearch =
        !search ||
        searchable.includes(search);


      const matchesLocation =
        !location ||
        String(
          job.area || ""
        )
          .toLowerCase()
          .includes(location);


      const matchesCategory =
        activeCategory === "All" ||
        !activeCategory ||
        String(
          job.category || ""
        ).toLowerCase() ===
        activeCategory.toLowerCase();


      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory
      );

    });


  grid.innerHTML = "";


  if (!filtered.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No jobs found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

  } else {

    filtered.forEach((job) => {

      grid.insertAdjacentHTML(
        "beforeend",
        createJobCard(job)
      );

    });

  }


  const count =
    $("#jobCount");

  if (count) {
    count.textContent =
      jobs.length;
  }

}


// =====================================================
// JOB CARD
// =====================================================

function createJobCard(job) {

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


  const category =
    esc(
      job.category ||
      "Other"
    );


  const title =
    esc(
      job.title ||
      "Untitled Job"
    );


  const description =
    esc(
      job.description ||
      "No description provided."
    );


  const area =
    esc(
      job.area ||
      "Location not specified"
    );


  const jobId =
    encodeURIComponent(
      job.id
    );


  return `
    <article class="job-card">

      <div class="job-card-top">

        <span class="job-category">
          ${category}
        </span>

        <span class="job-budget">
          ₹${budget}
        </span>

      </div>


      <h3 class="job-title">
        ${title}
      </h3>


      <p class="job-description">
        ${description}
      </p>


      <div class="job-location">
        📍 ${area}
      </div>


      ${
        job.contact
          ? `
            <div class="job-contact">
              📞 ${esc(job.contact)}
            </div>
          `
          : ""
      }


      <div class="job-actions">

        ${
          isOwner
            ? `
              <button
                class="btn primary"
                onclick="viewApplications('${jobId}')"
              >
                👥 Applications
              </button>
            `
            : `
              <button
                class="btn primary"
                onclick="applyToJob('${jobId}')"
              >
                Apply Now
              </button>

              <button
                class="btn secondary"
                onclick="chatFromJob(
                  '${jobId}',
                  '${encodeURIComponent(job.title || "Job")}',
                  '${safeId(job.ownerId)}'
                )"
              >
                💬 Chat
              </button>
            `
        }

      </div>

    </article>
  `;

}


// =====================================================
// SEARCH
// =====================================================

const searchInput =
  $("#searchInput");

const locationInput =
  $("#locationInput");

const searchBtn =
  $("#searchBtn");

if (searchInput) {

  searchInput.addEventListener(
    "input",
    renderJobs
  );

}

if (locationInput) {

  locationInput.addEventListener(
    "input",
    renderJobs
  );

}

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      renderJobs();

      $("#jobsSection")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


// =====================================================
// REFRESH JOBS
// =====================================================

const refreshJobs =
  $("#refreshJobs");

if (refreshJobs) {

  refreshJobs.addEventListener(
    "click",
    async () => {

      refreshJobs.disabled = true;

      await loadJobs();

      refreshJobs.disabled = false;

      toast(
        "Jobs refreshed."
      );

    }
  );

}


// =====================================================
// CATEGORY BUTTONS
// =====================================================

$$("[data-category]").forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        activeCategory =
          button.dataset.category ||
          "All";


        $$("[data-category]").forEach(
          (item) => {

            item.classList.remove(
              "active"
            );

          }
        );


        button.classList.add(
          "active"
        );


        renderJobs();


        $("#jobsSection")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  }
);


// =====================================================
// POST JOB
// =====================================================

function openPostJob() {

  if (!currentUser) {

    setAuthMode("login");

    openModal(
      "authModal"
    );

    toast(
      "Login first to post a job."
    );

    return;

  }


  openModal(
    "postJobModal"
  );

}


const heroPostJob =
  $("#heroPostJob");

const ctaPostJob =
  $("#ctaPostJob");

const navPost =
  $("#navPost");

if (heroPostJob) {

  heroPostJob.addEventListener(
    "click",
    openPostJob
  );

}

if (ctaPostJob) {

  ctaPostJob.addEventListener(
    "click",
    openPostJob
  );

}

if (navPost) {

  navPost.addEventListener(
    "click",
    openPostJob
  );

}

const mNavPost =
  $("#mNavPost");

if (mNavPost) {

  mNavPost.addEventListener(
    "click",
    openPostJob
  );

}


// =====================================================
// POST JOB FORM
// =====================================================

const jobForm =
  $("#jobForm");

if (jobForm) {

  jobForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (!currentUser) {

        openLogin();

        return;

      }


      const title =
        getField(
          jobForm,
          "title"
        );

      const category =
        getField(
          jobForm,
          "category"
        );

      const budget =
        Number(
          getField(
            jobForm,
            "budget"
          ) || 0
        );

      const area =
        getField(
          jobForm,
          "area"
        );

      const description =
        getField(
          jobForm,
          "description"
        );

      const contact =
        getField(
          jobForm,
          "contact"
        );

      const contactValue =
        getField(
          jobForm,
          "contactValue"
        );


      if (
        !title ||
        !category ||
        !area ||
        !description
      ) {

        toast(
          "Please fill all required fields."
        );

        return;

      }


      const submit =
        $("#postJobSubmit");

      if (submit) {
        submit.disabled = true;
        submit.textContent =
          "Publishing...";
      }


      try {

        await addDoc(
          collection(
            db,
            "jobs"
          ),
          {
            title:
              title,

            category:
              category,

            budget:
              budget,

            area:
              area,

            description:
              description,

            contact:
              contact,

            contactValue:
              contactValue,

            ownerId:
              currentUser.uid,

            ownerEmail:
              currentUser.email || "",

            createdAt:
              serverTimestamp()
          }
        );


        jobForm.reset();

        closeModal(
          "postJobModal"
        );


        toast(
          "Job published successfully!",
          "Job Posted"
        );


        await loadJobs();


        $("#jobsSection")
          ?.scrollIntoView({
            behavior: "smooth"
          });


      } catch (error) {

        console.error(
          "POST JOB ERROR:",
          error
        );

        toast(
          "Unable to publish job: " +
          (error.code || "unknown error")
        );

      } finally {

        if (submit) {

          submit.disabled = false;

          submit.textContent =
            "Publish Job";

        }

      }

    }
  );

}


// =====================================================
// APPLY TO JOB
// =====================================================

window.applyToJob =
  async function(encodedJobId) {

    if (!currentUser) {

      openLogin();

      return;

    }


    const jobId =
      decodeURIComponent(
        encodedJobId
      );


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

      const applicationId =
        `${jobId}_${currentUser.uid}`;


      const applicationRef =
        doc(
          db,
          "applications",
          applicationId
        );


      const existing =
        await getDoc(
          applicationRef
        );


      if (existing.exists()) {

        toast(
          "You already applied to this job."
        );

        return;

      }


      await setDoc(
        applicationRef,
        {
          jobId:
            jobId,

          jobTitle:
            job.title || "",

          jobOwnerId:
            job.ownerId || "",

          applicantId:
            currentUser.uid,

          applicantEmail:
            currentUser.email || "",

          applicantName:
            currentProfile.name || "",

          status:
            "pending",

          createdAt:
            serverTimestamp()
        }
      );


      toast(
        "Application sent successfully!",
        "Application"
      );


    } catch (error) {

      console.error(
        "APPLICATION ERROR:",
        error
      );

      toast(
        "Application failed: " +
        (error.code || "unknown error")
      );

    }

  };


// =====================================================
// VIEW APPLICATIONS
// =====================================================

window.viewApplications =
  async function(encodedJobId) {

    if (!currentUser) {

      openLogin();

      return;

    }


    const jobId =
      decodeURIComponent(
        encodedJobId
      );


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
      job.ownerId !==
      currentUser.uid
    ) {

      toast(
        "Only the job owner can view applications."
      );

      return;

    }


    const list =
      $("#applicationsList");


    if (!list) return;


    list.innerHTML = `
      <div class="loading">
        Loading applicants...
      </div>
    `;


    openModal(
      "applicationsModal"
    );


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

        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No applications yet</h3>
            <p>Applicants will appear here.</p>
          </div>
        `;

        return;

      }


      const applications =
        snapshot.docs.map(
          (item) => ({
            id:
              item.id,

            ...item.data()
          })
        );


      list.innerHTML = "";


      for (
        const application
        of applications
      ) {

        let applicant =
          null;


        try {

          const profileSnapshot =
            await getDoc(
              doc(
                db,
                "users",
                application.applicantId
              )
            );


          if (
            profileSnapshot.exists()
          ) {

            applicant =
              profileSnapshot.data();

          }

        } catch (profileError) {

          console.error(
            "APPLICANT PROFILE ERROR:",
            profileError
          );

        }


        const applicantName =
          applicant?.name ||
          application.applicantName ||
          application.applicantEmail ||
          "Applicant";


        const applicantRole =
          applicant?.role ||
          "Freelancer";


        const applicantArea =
          applicant?.area ||
          "Location not added";


        const applicantSkills =
          applicant?.skills ||
          "Skills not added";


        list.insertAdjacentHTML(
          "beforeend",
          `
          <div class="application-card">

            <div class="application-avatar">
              ${esc(
                applicantName
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div class="application-info">

              <h3>
                ${esc(
                  applicantName
                )}
              </h3>

              <p>
                ${esc(
                  applicantRole
                )}
              </p>

              <p>
                📍 ${esc(
                  applicantArea
                )}
              </p>

              <p>
                🛠️ ${esc(
                  applicantSkills
                )}
              </p>

              <span class="status">
                ${esc(
                  application.status ||
                  "pending"
                )}
              </span>

            </div>

            <div class="application-actions">

              <button
                class="btn secondary"
                onclick="viewApplicantProfile(
                  '${safeId(application.applicantId)}'
                )"
              >
                View Profile
              </button>

              <button
                class="btn primary"
                onclick="chatFromJob(
                  '${encodeURIComponent(jobId)}',
                  '${encodeURIComponent(job.title || "Job")}',
                  '${safeId(application.applicantId)}'
                )"
              >
                💬 Chat
              </button>

            </div>

          </div>
          `
        );

      }


    } catch (error) {

      console.error(
        "APPLICATION LOAD ERROR:",
        error
      );


      list.innerHTML = `
        <div class="empty-state">
          <h3>Unable to load applications</h3>
          <p>${esc(error.code || "Unknown error")}</p>
        </div>
      `;

    }

  };


// =====================================================
// APPLICANT PROFILE
// =====================================================

window.viewApplicantProfile =
  async function(userId) {

    if (!currentUser) {

      openLogin();

      return;

    }


    try {

      const snapshot =
        await getDoc(
          doc(
            db,
            "users",
            userId
          )
        );


      if (!snapshot.exists()) {

        toast(
          "Applicant profile not found."
        );

        return;

      }


      const profile =
        snapshot.data();


      const name =
        profile.name ||
        "Applicant";


      const avatar =
        $("#applicantAvatar");

      if (avatar) {

        avatar.textContent =
          name
            .charAt(0)
            .toUpperCase();

      }


      const role =
        $("#applicantRole");

      if (role) {

        role.textContent =
          profile.role ||
          "Freelancer";

      }


      const nameEl =
        $("#applicantName");

      if (nameEl) {

        nameEl.textContent =
          name;

      }


      const area =
        $("#applicantArea");

      if (area) {

        area.textContent =
          profile.area ||
          "Location not added";

      }


      const skills =
        $("#applicantSkills");

      if (skills) {

        skills.textContent =
          profile.skills ||
          "Skills not added";

      }


      const about =
        $("#applicantAbout");

      if (about) {

        about.textContent =
          profile.about ||
          "No about information.";

      }


      const contact =
        $("#applicantContact");

      if (contact) {

        contact.textContent =
          profile.contact ||
          profile.email ||
          "Contact not added";

      }


      window.currentApplicant =
        profile;


      window.currentApplicantId =
        userId;


      const chatButton =
        $("#applicantChatBtn");

      if (chatButton) {

        chatButton.onclick =
          async () => {

            const job =
              jobs.find(
                (item) =>
                  item.ownerId ===
                  currentUser.uid
              );


            const jobId =
              job?.id ||
              window.currentChatJobId ||
              "profile";


            await window.chatFromJob(
              jobId,
              encodeURIComponent(
                job?.title ||
                "LocalWork"
              ),
              userId
            );

          };

      }


      const contactButton =
        $("#applicantContactBtn");

      if (contactButton) {

        contactButton.onclick =
          () => {

            const value =
              profile.contact ||
              profile.email ||
              "";

            if (!value) {

              toast(
                "Applicant has not added contact details."
              );

              return;

            }


            if (
              value.includes("@")
            ) {

              window.location.href =
                `mailto:${value}`;

            } else {

              window.location.href =
                `tel:${value}`;

            }

          };

      }


      openModal(
        "applicantProfileModal"
      );


    } catch (error) {

      console.error(
        "APPLICANT PROFILE ERROR:",
        error
      );

      toast(
        "Unable to open applicant profile."
      );

    }

  };


// =====================================================
// ENSURE CHAT
// =====================================================

async function ensureChat(
  jobId,
  title,
  otherUserId
) {

  if (!currentUser) {

    toast(
      "Login first."
    );

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


  const participants = [
    currentUser.uid,
    otherUserId
  ].sort();


  const chatId =
    `${jobId}_${participants[0]}_${participants[1]}`;


  await setDoc(
    doc(
      db,
      "chats",
      chatId
    ),
    {
      jobId:
        jobId,

      jobTitle:
        title || "LocalWork Chat",

      participants:
        participants,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );


  return chatId;

}


// =====================================================
// CHAT FROM JOB
// =====================================================

window.chatFromJob =
  async function(
    encodedJobId,
    encodedTitle,
    otherUserId
  ) {

    if (!currentUser) {

      openLogin();

      return;

    }


    const jobId =
      decodeURIComponent(
        encodedJobId || ""
      );


    let title =
      "LocalWork Chat";


    try {

      title =
        decodeURIComponent(
          encodedTitle || ""
        ) ||
        "LocalWork Chat";

    } catch {

      title =
        "LocalWork Chat";

    }


    try {

      const chatId =
        await ensureChat(
          jobId,
          title,
          otherUserId
        );


      if (!chatId) return;


      await window.openChat(
        chatId,
        encodeURIComponent(title)
      );


    } catch (error) {

      console.error(
        "CHAT CREATE ERROR:",
        error
      );

      toast(
        "Unable to open chat: " +
        (error.code || "unknown error")
      );

    }

  };


// =====================================================
// OPEN CHAT
// =====================================================

window.openChat =
  async function(
    chatId,
    encodedTitle
  ) {

    if (!currentUser) {

      openLogin();

      return;

    }


    let title =
      "LocalWork Chat";


    try {

      title =
        decodeURIComponent(
          encodedTitle || ""
        ) ||
        "LocalWork Chat";

    } catch {

      title =
        "LocalWork Chat";

    }


    window.currentChatId =
      chatId;


    const chatTitle =
      $("#chatUserName");

    if (chatTitle) {

      chatTitle.textContent =
        title;

    }


    const chatJobTitle =
      $("#chatJobTitle");

    if (chatJobTitle) {

      chatJobTitle.textContent =
        title;

    }


    openModal(
      "chatModal"
    );


    const messagesArea =
      $("#messagesArea");


    if (!messagesArea) {

      toast(
        "Messages area not found."
      );

      return;

    }


    if (
      window.chatUnsubscribe
    ) {

      window.chatUnsubscribe();

      window.chatUnsubscribe =
        null;

    }


    messagesArea.innerHTML = `
      <div class="loading">
        Loading messages...
      </div>
    `;


    const messagesQuery =
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
        messagesQuery,
        (snapshot) => {

          if (snapshot.empty) {

            messagesArea.innerHTML = `
              <div class="empty-chat">
                <div>💬</div>
                <p>No messages yet.</p>
                <small>Start the conversation.</small>
              </div>
            `;

            return;

          }


          messagesArea.innerHTML =
            snapshot.docs
              .map((item) => {

                const message =
                  item.data();


                const mine =
                  message.senderId ===
                  currentUser.uid;


                const time =
                  message.createdAt?.toDate
                    ? message.createdAt
                        .toDate()
                        .toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit"
                          }
                        )
                    : "";


                return `
                  <div
                    class="
                      chat-message
                      ${mine ? "mine" : "other"}
                    "
                  >

                    <div class="message-bubble">
                      ${esc(
                        message.text || ""
                      )}
                    </div>

                    ${
                      time
                        ? `
                          <small>
                            ${esc(time)}
                          </small>
                        `
                        : ""
                    }

                  </div>
                `;

              })
              .join("");


          messagesArea.scrollTop =
            messagesArea.scrollHeight;

        },
        (error) => {

          console.error(
            "CHAT LISTENER ERROR:",
            error
          );

          messagesArea.innerHTML = `
            <div class="empty-chat">
              <p>Unable to load messages.</p>
            </div>
          `;

          toast(
            "Chat error: " +
            (error.code || "unknown error")
          );

        }
      );


    // =================================================
    // SEND MESSAGE
    // =================================================

    const messageForm =
      $("#messageForm");


    if (!messageForm) {

      toast(
        "Message form not found."
      );

      return;

    }


    messageForm.onsubmit =
      async (event) => {

        event.preventDefault();


        const input =
          $("#messageInput") ||
          messageForm.querySelector(
            '[name="message"]'
          );


        if (!input) {

          toast(
            "Message input not found."
          );

          return;

        }


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
                currentUser.email || "",

              text:
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

          input.focus();


        } catch (error) {

          console.error(
            "SEND MESSAGE ERROR:",
            error
          );

          toast(
            "Message failed: " +
            (error.code || "unknown error")
          );

        }

      };

  };


// =====================================================
// MY CHATS
// =====================================================

async function loadChats() {

  if (!currentUser) {

    openLogin();

    return;

  }


  const list =
    $("#chatList");


  if (!list) {

    toast(
      "Chat list not found."
    );

    return;

  }


  list.innerHTML = `
    <div class="loading">
      Loading chats...
    </div>
  `;


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

      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>No chats yet</h3>
          <p>Open a job and start chatting.</p>
        </div>
      `;

      return;

    }


    const chats =
      snapshot.docs
        .map((item) => ({
          id:
            item.id,

          ...item.data()
        }))
        .sort(
          (a, b) =>
            (b.updatedAt?.seconds || 0) -
            (a.updatedAt?.seconds || 0)
        );


    list.innerHTML =
      chats
        .map((chat) => {

          return `
            <div class="chat-card">

              <div class="chat-card-avatar">
                💬
              </div>

              <div class="chat-card-content">

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

              </div>

              <button
                class="btn primary"
                onclick="openChat(
                  '${safeId(chat.id)}',
                  '${encodeURIComponent(
                    chat.jobTitle ||
                    "LocalWork Chat"
                  )}'
                )"
              >
                Open
              </button>

            </div>
          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "LOAD CHATS ERROR:",
      error
    );


    list.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load chats</h3>
      </div>
    `;


    toast(
      "Unable to load chats: " +
      (error.code || "unknown error")
    );

  }

}


// =====================================================
// CHAT NAV
// =====================================================

const navChats =
  $("#navChats");

if (navChats) {

  navChats.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        openLogin();

        return;

      }

      await loadChats();

      openModal(
        "chatsModal"
      );

    }
  );

}


const mNavChats =
  $("#mNavChats");

if (mNavChats) {

  mNavChats.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        openLogin();

        return;

      }

      await loadChats();

      openModal(
        "chatsModal"
      );

    }
  );

}


// =====================================================
// CHAT BACK BUTTON
// =====================================================

const chatBackBtn =
  $("#chatBackBtn");

if (chatBackBtn) {

  chatBackBtn.addEventListener(
    "click",
    () => {

      if (
        window.chatUnsubscribe
      ) {

        window.chatUnsubscribe();

        window.chatUnsubscribe =
          null;

      }


      closeModal(
        "chatModal"
      );

      loadChats();

      openModal(
        "chatsModal"
      );

    }
  );

}


// =====================================================
// CLOSE CHAT CLEANUP
// =====================================================

const chatModal =
  $("#chatModal");

if (chatModal) {

  chatModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        chatModal
      ) {

        if (
          window.chatUnsubscribe
        ) {

          window.chatUnsubscribe();

          window.chatUnsubscribe =
            null;

        }

      }

    }
  );

}


// =====================================================
// EMOJI BUTTON
// =====================================================

const emojiBtn =
  $("#emojiBtn");

if (emojiBtn) {

  emojiBtn.addEventListener(
    "click",
    () => {

      const input =
        $("#messageInput");

      if (!input) return;


      const emojis = [
        "😊",
        "👍",
        "❤️",
        "😂",
        "🔥",
        "🙏",
        "👋",
        "✅"
      ];


      const emoji =
        emojis[
          Math.floor(
            Math.random() *
            emojis.length
          )
        ];


      input.value += emoji;

      input.focus();

    }
  );

}


// =====================================================
// NAV JOBS
// =====================================================

const navJobs =
  $("#navJobs");

if (navJobs) {

  navJobs.addEventListener(
    "click",
    () => {

      $("#jobsSection")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


const mNavJobs =
  $("#mNavJobs");

if (mNavJobs) {

  mNavJobs.addEventListener(
    "click",
    () => {

      $("#jobsSection")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


// =====================================================
// HERO FIND JOBS
// =====================================================

const heroFindJobs =
  $("#heroFindJobs");

if (heroFindJobs) {

  heroFindJobs.addEventListener(
    "click",
    () => {

      $("#jobsSection")
        ?.scrollIntoView({
          behavior: "smooth"
        });

      $("#searchInput")
        ?.focus();

    }
  );

}


// =====================================================
// BRAND HOME
// =====================================================

const brandHome =
  $("#brandHome");

if (brandHome) {

  brandHome.addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


// =====================================================
// PROFILE NAV
// =====================================================

const navAccount =
  $("#navAccount");

if (navAccount) {

  navAccount.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openLogin();

        return;

      }

      fillProfileForm();

      openModal(
        "profileModal"
      );

    }
  );

}


// =====================================================
// TOGGLE PASSWORD
// =====================================================

const togglePassword =
  $("#togglePassword");

if (togglePassword) {

  togglePassword.addEventListener(
    "click",
    () => {

      const password =
        $("#authPassword");

      if (!password) return;


      if (
        password.type ===
        "password"
      ) {

        password.type =
          "text";

        togglePassword.textContent =
          "🙈";

      } else {

        password.type =
          "password";

        togglePassword.textContent =
          "👁️";

      }

    }
  );

}


// =====================================================
// TOAST CLOSE
// =====================================================

const toastClose =
  $("#toastClose");

if (toastClose) {

  toastClose.addEventListener(
    "click",
    () => {

      $("#toast")
        ?.classList
        .remove("show");

    }
  );

}


// =====================================================
// YEAR
// =====================================================

const year =
  $("#year");

if (year) {

  year.textContent =
    new Date().getFullYear();

}


// =====================================================
// PAGE LOADER
// =====================================================

window.addEventListener(
  "load",
  () => {

    const loader =
      $("#pageLoader");

    if (loader) {

      setTimeout(() => {

        loader.classList.add(
          "hidden"
        );

      }, 500);

    }

  }
);


// =====================================================
// INITIAL
// =====================================================

setAuthMode("login");

console.log(
  "LocalWork V5 Firebase loaded successfully."
);
