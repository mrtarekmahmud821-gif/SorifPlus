import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzaSJuMumdlp_ZzjKvatvGm_7XLxq3jFM",
  authDomain: "link-click-work.firebaseapp.com",
  databaseURL: "https://link-click-work-default-rtdb.firebaseio.com",
  projectId: "link-click-work",
  storageBucket: "link-click-work.firebasestorage.app",
  messagingSenderId: "1098565051426",
  appId: "1:1098565051426:web:a99ee9186b0f481954167b",
  measurementId: "G-PLHRG49TXJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const ALLOWED_EMAIL = "tarekmahmud821@gmail.com";
const ALLOWED_UID = "FahnXuZGlmhxn3zfgbroZDBlj7D2";

// ==================== AUTH ====================
window.adminLogin = async function () {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (email !== ALLOWED_EMAIL) {
    document.getElementById("loginError").innerText = "এই ইমেইল দিয়ে লগইন করা যাবে না!";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user.uid !== ALLOWED_UID) {
      await signOut(auth);
      document.getElementById("loginError").innerText = "অনুমোদিত অ্যাডমিন নন!";
      return;
    }
    // success → onAuthStateChanged will handle
  } catch (error) {
    document.getElementById("loginError").innerText = "লগইন ব্যর্থ: " + error.message;
  }
};

window.logout = function () {
  signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ALLOWED_EMAIL && user.uid === ALLOWED_UID) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("adminName").innerText = user.email;
    loadPackages();
    loadUsers();
    loadPayments();
    loadChannels();
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("dashboard").style.display = "none";
  }
});

// ==================== NAVIGATION ====================
window.showSection = function (section) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(section + "Section").style.display = "block";
  event.target.classList.add("active");
};

// ==================== PACKAGES ====================
window.addPackage = function () {
  const name = document.getElementById("pkgName").value.trim();
  const price = Number(document.getElementById("pkgPrice").value);
  const days = Number(document.getElementById("pkgDays").value);

  if (!name || !price || !days) {
    alert("সব ফিল্ড পূরণ করুন");
    return;
  }

  const newRef = push(ref(db, "packages"));
  set(newRef, {
    name,
    price,
    durationDays: days,
    active: true,
    createdAt: Date.now()
  }).then(() => {
    alert("Package যোগ হয়েছে!");
    document.getElementById("pkgName").value = "";
    document.getElementById("pkgPrice").value = "";
    document.getElementById("pkgDays").value = "";
  });
};

function loadPackages() {
  onValue(ref(db, "packages"), (snapshot) => {
    const list = document.getElementById("packagesList");
    list.innerHTML = "";
    snapshot.forEach((child) => {
      const data = child.val();
      const id = child.key;
      list.innerHTML += `
        <div class="card">
          <h3>${data.name}</h3>
          <p>Price: ৳${data.price}</p>
          <p>Duration: ${data.durationDays} Days</p>
          <div class="actions">
            <button class="btn-edit" onclick="editPackage('\( {id}', ' \){data.name}', ${data.price}, ${data.durationDays})">Edit</button>
            <button class="btn-delete" onclick="deletePackage('${id}')">Delete</button>
          </div>
        </div>
      `;
    });
  });
}

window.editPackage = function (id, name, price, days) {
  const newName = prompt("Package Name:", name);
  const newPrice = prompt("Price:", price);
  const newDays = prompt("Duration (Days):", days);

  if (newName && newPrice && newDays) {
    update(ref(db, "packages/" + id), {
      name: newName,
      price: Number(newPrice),
      durationDays: Number(newDays)
    });
  }
};

window.deletePackage = function (id) {
  if (confirm("ডিলিট করতে চান?")) {
    remove(ref(db, "packages/" + id));
  }
};

// ==================== USERS ====================
function loadUsers() {
  onValue(ref(db, "users"), (snapshot) => {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    snapshot.forEach((child) => {
      const data = child.val();
      const id = child.key;
      const sub = data.subscription || {};
      list.innerHTML += `
        <div class="card">
          <h3>${data.name || "No Name"}</h3>
          <p>Email: ${data.email || "-"}</p>
          <p>Phone: ${data.phone || "-"}</p>
          <p>Status: ${sub.status || "None"}</p>
          <p>Expiry: ${sub.expiry ? new Date(sub.expiry).toLocaleDateString() : "-"}</p>
          <div class="actions">
            <button class="btn-edit" onclick="editUser('${id}')">Edit</button>
          </div>
        </div>
      `;
    });
  });
}

window.editUser = function (uid) {
  const days = prompt("কত দিন সাবস্ক্রিপশন দিবেন? (0 দিলে ক্যান্সেল)");
  if (days === null) return;

  const expiry = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;

  update(ref(db, "users/" + uid + "/subscription"), {
    status: days > 0 ? "active" : "expired",
    expiry: expiry,
    updatedAt: Date.now()
  }).then(() => alert("User আপডেট হয়েছে"));
};

// ==================== PAYMENTS ====================
function loadPayments() {
  onValue(ref(db, "payments"), (snapshot) => {
    const list = document.getElementById("paymentsList");
    list.innerHTML = "";
    snapshot.forEach((child) => {
      const data = child.val();
      const id = child.key;
      if (data.status !== "pending") return; // শুধু pending দেখাবে

      list.innerHTML += `
        <div class="card">
          <h3>Payment Request</h3>
          <p>User: ${data.userEmail || data.userId}</p>
          <p>Package: ${data.packageName}</p>
          <p>Amount: ৳${data.amount}</p>
          <p>TrxID: ${data.transactionId}</p>
          <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
          <span class="badge pending">Pending</span>
          <div class="actions">
            <button class="btn-approve" onclick="approvePayment('\( {id}', ' \){data.userId}', ${data.durationDays})">Approve</button>
            <button class="btn-reject" onclick="rejectPayment('${id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
}

window.approvePayment = function (paymentId, userId, days) {
  const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);

  update(ref(db, "payments/" + paymentId), { status: "approved" });
  update(ref(db, "users/" + userId + "/subscription"), {
    status: "active",
    expiry: expiry,
    updatedAt: Date.now()
  }).then(() => alert("Payment Approved!"));
};

window.rejectPayment = function (paymentId) {
  update(ref(db, "payments/" + paymentId), { status: "rejected" })
    .then(() => alert("Payment Rejected"));
};

// ==================== CHANNELS ====================
window.addChannel = function () {
  const name = document.getElementById("chName").value.trim();
  const logo = document.getElementById("chLogo").value.trim();
  const url = document.getElementById("chUrl").value.trim();
  const category = document.getElementById("chCategory").value;

  if (!name || !url) {
    alert("Channel Name এবং Stream URL দিতে হবে");
    return;
  }

  const newRef = push(ref(db, "channels"));
  set(newRef, {
    name,
    logo: logo || "",
    url,
    category,
    active: true,
    createdAt: Date.now()
  }).then(() => {
    alert("Channel যোগ হয়েছে!");
    document.getElementById("chName").value = "";
    document.getElementById("chLogo").value = "";
    document.getElementById("chUrl").value = "";
  });
};

function loadChannels() {
  onValue(ref(db, "channels"), (snapshot) => {
    const list = document.getElementById("channelsList");
    list.innerHTML = "";
    snapshot.forEach((child) => {
      const data = child.val();
      const id = child.key;
      list.innerHTML += `
        <div class="card">
          <h3>${data.name}</h3>
          <p>Category: ${data.category}</p>
          <p style="font-size:11px;word-break:break-all;">${data.url}</p>
          \( {data.logo ? `<img src=" \){data.logo}" style="width:60px;height:40px;object-fit:contain;margin-top:8px;">` : ""}
          <div class="actions">
            <button class="btn-delete" onclick="deleteChannel('${id}')">Delete</button>
          </div>
        </div>
      `;
    });
  });
}

window.deleteChannel = function (id) {
  if (confirm("Channel ডিলিট করতে চান?")) {
    remove(ref(db, "channels/" + id));
  }
};
