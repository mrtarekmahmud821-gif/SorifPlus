import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzaSJuMumdlp_ZzjKvatvGm_7XLxq3jFM",
  authDomain: "link-click-work.firebaseapp.com",
  projectId: "link-click-work",
  storageBucket: "link-click-work.firebasestorage.app",
  messagingSenderId: "1098565051426",
  appId: "1:1098565051426:web:a99ee9186b0f481954167b",
  measurementId: "G-PLHRG49TXJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
window.addPackage = async function () {
  const name = document.getElementById("pkgName").value.trim();
  const price = Number(document.getElementById("pkgPrice").value);
  const days = Number(document.getElementById("pkgDays").value);

  if (!name || !price || !days) {
    alert("সব ফিল্ড পূরণ করুন");
    return;
  }

  try {
    await addDoc(collection(db, "packages"), {
      name,
      price,
      durationDays: days,
      active: true,
      createdAt: serverTimestamp()
    });
    alert("Package যোগ হয়েছে!");
    document.getElementById("pkgName").value = "";
    document.getElementById("pkgPrice").value = "";
    document.getElementById("pkgDays").value = "";
  } catch (error) {
    alert("Error: " + error.message);
  }
};

function loadPackages() {
  onSnapshot(collection(db, "packages"), (snapshot) => {
    const list = document.getElementById("packagesList");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
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

window.editPackage = async function (id, name, price, days) {
  const newName = prompt("Package Name:", name);
  const newPrice = prompt("Price:", price);
  const newDays = prompt("Duration (Days):", days);

  if (newName && newPrice && newDays) {
    await updateDoc(doc(db, "packages", id), {
      name: newName,
      price: Number(newPrice),
      durationDays: Number(newDays)
    });
  }
};

window.deletePackage = async function (id) {
  if (confirm("ডিলিট করতে চান?")) {
    await deleteDoc(doc(db, "packages", id));
  }
};

// ==================== USERS ====================
function loadUsers() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const sub = data.subscription || {};
      list.innerHTML += `
        <div class="card">
          <h3>${data.name || "No Name"}</h3>
          <p>Email: ${data.email || "-"}</p>
          <p>Phone: ${data.phone || "-"}</p>
          <p>Status: ${sub.status || "None"}</p>
          <p>Expiry: ${sub.expiry ? new Date(sub.expiry).toLocaleDateString() : "-"}</p>
          <div class="actions">
            <button class="btn-edit" onclick="editUser('${id}')">Edit Subscription</button>
          </div>
        </div>
      `;
    });
  });
}

window.editUser = async function (uid) {
  const days = prompt("কত দিন সাবস্ক্রিপশন দিবেন? (0 দিলে ক্যান্সেল)");
  if (days === null) return;

  const expiry = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;

  await updateDoc(doc(db, "users", uid), {
    subscription: {
      status: days > 0 ? "active" : "expired",
      expiry: expiry,
      updatedAt: Date.now()
    }
  });
  alert("User আপডেট হয়েছে");
};

// ==================== PAYMENTS ====================
function loadPayments() {
  const q = query(collection(db, "payments"), where("status", "==", "pending"));
  
  onSnapshot(q, (snapshot) => {
    const list = document.getElementById("paymentsList");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      list.innerHTML += `
        <div class="card">
          <h3>Payment Request</h3>
          <p>User: ${data.userEmail || data.userId}</p>
          <p>Package: ${data.packageName}</p>
          <p>Amount: ৳${data.amount}</p>
          <p>TrxID: ${data.transactionId}</p>
          <p>Time: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : "-"}</p>
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

window.approvePayment = async function (paymentId, userId, days) {
  const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);

  await updateDoc(doc(db, "payments", paymentId), { 
    status: "approved",
    approvedAt: Date.now()
  });

  await updateDoc(doc(db, "users", userId), {
    subscription: {
      status: "active",
      expiry: expiry,
      updatedAt: Date.now()
    }
  });

  alert("Payment Approved!");
};

window.rejectPayment = async function (paymentId) {
  await updateDoc(doc(db, "payments", paymentId), { 
    status: "rejected",
    rejectedAt: Date.now()
  });
  alert("Payment Rejected");
};

// ==================== CHANNELS ====================
window.addChannel = async function () {
  const name = document.getElementById("chName").value.trim();
  const logo = document.getElementById("chLogo").value.trim();
  const url = document.getElementById("chUrl").value.trim();
  const category = document.getElementById("chCategory").value;

  if (!name || !url) {
    alert("Channel Name এবং Stream URL দিতে হবে");
    return;
  }

  try {
    await addDoc(collection(db, "channels"), {
      name,
      logo: logo || "",
      url,
      category,
      active: true,
      createdAt: serverTimestamp()
    });
    alert("Channel যোগ হয়েছে!");
    document.getElementById("chName").value = "";
    document.getElementById("chLogo").value = "";
    document.getElementById("chUrl").value = "";
  } catch (error) {
    alert("Error: " + error.message);
  }
};

function loadChannels() {
  onSnapshot(collection(db, "channels"), (snapshot) => {
    const list = document.getElementById("channelsList");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
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

window.deleteChannel = async function (id) {
  if (confirm("Channel ডিলিট করতে চান?")) {
    await deleteDoc(doc(db, "channels", id));
  }
};
