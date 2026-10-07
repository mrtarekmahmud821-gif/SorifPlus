import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc,
  onSnapshot, 
  query, 
  where, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase Configuration
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
const db = getFirestore(app);

let currentUser = null;
let selectedPackage = null;
let currentHls = null;
let currentCategory = 'sports';
let userListener = null;
let expiryCheckInterval = null;

// Helper to format Phone into synthetic email
function phoneToEmail(phone) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `${cleanPhone}@streamx.com`;
}

// Stop video player immediately
function stopVideoPlayer() {
  const video = document.getElementById('player');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
}

// ==================== AUTH TABS ====================
window.switchAuthTab = function(tab) {
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabLoginBtn");
  const tabReg = document.getElementById("tabRegisterBtn");
  document.getElementById("authMessage").innerText = "";

  if (tab === 'login') {
    loginForm.style.display = "block";
    regForm.style.display = "none";
    tabLogin.classList.add("active");
    tabReg.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    regForm.style.display = "block";
    tabReg.classList.add("active");
    tabLogin.classList.remove("active");
  }
};

// ==================== AUTHENTICATION LOGIC ====================
window.handleRegister = async function(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const msgEl = document.getElementById("authMessage");
  const btn = document.getElementById("regSubmitBtn");

  if (password.length < 6) {
    msgEl.innerText = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
    return;
  }

  btn.disabled = true;
  msgEl.innerText = "একাউন্ট তৈরি হচ্ছে...";

  const email = phoneToEmail(phone);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user record in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      phone: phone,
      email: email,
      subscription: {
        status: "expired",
        expiry: 0
      },
      createdAt: serverTimestamp()
    });

    msgEl.style.color = "#28a745";
    msgEl.innerText = "একাউন্ট তৈরি সফল হয়েছে!";
  } catch (error) {
    btn.disabled = false;
    msgEl.style.color = "#ff4d4d";
    if (error.code === "auth/email-already-in-use") {
      msgEl.innerText = "এই ফোন নম্বরে ইতিপূর্বে একাউন্ট তৈরি করা হয়েছে।";
    } else {
      msgEl.innerText = error.message;
    }
  }
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msgEl = document.getElementById("authMessage");
  const btn = document.getElementById("loginSubmitBtn");

  btn.disabled = true;
  msgEl.innerText = "লগইন হচ্ছে...";

  const email = phoneToEmail(phone);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    msgEl.style.color = "#28a745";
    msgEl.innerText = "লগইন সফল!";
  } catch (error) {
    btn.disabled = false;
    msgEl.style.color = "#ff4d4d";
    msgEl.innerText = "ফোন নম্বর অথবা পাসওয়ার্ড ভুল!";
  }
};

window.handleLogout = function() {
  stopVideoPlayer();
  if (userListener) userListener();
  if (expiryCheckInterval) clearInterval(expiryCheckInterval);
  signOut(auth);
};

// ==================== REALTIME SECURITY & SUBSCRIPTION WATCHER ====================
onAuthStateChanged(auth, (user) => {
  const authScreen = document.getElementById("authScreen");
  const subScreen = document.getElementById("subScreen");
  const mainApp = document.getElementById("mainApp");

  if (userListener) userListener();
  if (expiryCheckInterval) clearInterval(expiryCheckInterval);

  if (user) {
    currentUser = user;
    authScreen.style.display = "none";

    // Listen to realtime changes on user's subscription in Firestore
    userListener = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const sub = userData?.subscription || {};
      const now = Date.now();

      // Check active status and timestamp expiration
      if (sub.status === "active" && sub.expiry && sub.expiry > now) {
        subScreen.style.display = "none";
        mainApp.style.display = "flex";

        // Load channels dynamically
        loadChannels(currentCategory);

        // Continuous interval check for live expiration
        if (expiryCheckInterval) clearInterval(expiryCheckInterval);
        expiryCheckInterval = setInterval(() => {
          if (Date.now() >= sub.expiry) {
            clearInterval(expiryCheckInterval);
            updateDoc(doc(db, "users", user.uid), {
              "subscription.status": "expired"
            });
            revokeAccess("আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে!");
          }
        }, 3000);

      } else {
        revokeAccess("আপনার কোনো সক্রিয় সাবস্ক্রিপশন নেই!");
      }
    }, (err) => {
      console.error("Firestore error:", err);
    });

  } else {
    currentUser = null;
    stopVideoPlayer();
    authScreen.style.display = "flex";
    subScreen.style.display = "none";
    mainApp.style.display = "none";
  }
});

// Revoke App Access immediately
function revokeAccess(reasonMessage) {
  stopVideoPlayer();
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("subScreen").style.display = "flex";
  if (reasonMessage) {
    document.getElementById("subMessage").innerText = reasonMessage;
  }
  loadPackages();
}

// ==================== SUBSCRIPTION LOGIC ====================
function loadPackages() {
  const pkgList = document.getElementById("packageList");
  pkgList.innerHTML = "প্যাকেজ লোড হচ্ছে...";

  onSnapshot(collection(db, "packages"), (snapshot) => {
    pkgList.innerHTML = "";
    if (snapshot.empty) {
      pkgList.innerHTML = "<p style='color:#888'>কোনো সক্রিয় প্যাকেজ পাওয়া যায়নি</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const pkg = docSnap.data();
      const id = docSnap.id;
      if (pkg.active !== false) {
        pkgList.innerHTML += `
          <div class="package-card" onclick="selectPackage('${id}', '${pkg.name}', ${pkg.price}, ${pkg.durationDays})">
            <div class="package-info">
              <h4>${pkg.name}</h4>
              <p>মেয়াদ: ${pkg.durationDays} দিন</p>
            </div>
            <div class="package-price">৳${pkg.price}</div>
          </div>
        `;
      }
    });
  });
}

window.selectPackage = function(id, name, price, days) {
  selectedPackage = { id, name, price, days };
  document.getElementById("selectedPkgText").innerText = `নির্বাচিত প্যাকেজ: ${name} (৳${price} - ${days} দিন)`;
  document.getElementById("paymentFormBox").style.display = "block";
};

window.cancelPaymentSelect = function() {
  selectedPackage = null;
  document.getElementById("paymentFormBox").style.display = "none";
};

window.submitPaymentRequest = async function() {
  const trxId = document.getElementById("trxIdInput").value.trim();
  const msgEl = document.getElementById("subMessage");

  if (!trxId) {
    alert("Transaction ID (TrxID) প্রদান করুন।");
    return;
  }

  try {
    await addDoc(collection(db, "payments"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      packageName: selectedPackage.name,
      amount: selectedPackage.price,
      durationDays: selectedPackage.days,
      transactionId: trxId,
      status: "pending",
      timestamp: Date.now()
    });

    alert("পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করার পর আপনার সাবস্ক্রিপশন চালু হবে।");
    document.getElementById("trxIdInput").value = "";
    cancelPaymentSelect();
  } catch (error) {
    msgEl.innerText = "এরর: " + error.message;
  }
};

// ==================== CHANNELS & PLAYER LOGIC ====================
window.selectCategory = function(cat, element) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  element.classList.add('active');
  loadChannels(cat);
};

function loadChannels(category) {
  const list = document.getElementById('channelList');
  const status = document.getElementById('status');
  list.innerHTML = 'চ্যানেল লোড হচ্ছে...';

  const q = query(
    collection(db, "channels"), 
    where("category", "==", category)
  );

  onSnapshot(q, (snapshot) => {
    list.innerHTML = '';
    
    if (snapshot.empty) {
      list.innerHTML = `<p style="color:#888; grid-column: 1/-1; text-align:center;">${category.toUpperCase()} ক্যাটাগরিতে কোনো চ্যানেল নেই</p>`;
      status.innerText = `${category.toUpperCase()} • 0 টি চ্যানেল`;
      return;
    }

    let count = 0;
    snapshot.forEach((docSnap) => {
      const ch = docSnap.data();
      if (ch.active !== false) {
        count++;
        const div = document.createElement('div');
        div.className = 'channel';
        div.innerHTML = `
          ${ch.logo ? `<img src="${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">` : ''}
          <div class="channel-name">${ch.name}</div>
        `;
        div.onclick = () => playChannel(ch, div);
        list.appendChild(div);
      }
    });

    status.innerText = `${category.toUpperCase()} ক্যাটাগরি • ${count} টি চ্যানেল`;
  });
}

function playChannel(ch, element) {
  if (!ch.url) {
    alert('চ্যানেলের স্ট্রিম URL পাওয়া যায়নি');
    return;
  }

  document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
  element.classList.add('active');

  const video = document.getElementById('player');
  const status = document.getElementById('status');

  status.innerText = 'প্লে হচ্ছে: ' + ch.name;

  if (Hls.isSupported()) {
    if (currentHls) {
      currentHls.destroy();
    }
    currentHls = new Hls();
    currentHls.loadSource(ch.url);
    currentHls.attachMedia(video);
    currentHls.on(Hls.Events.MANIFEST_PARSED, function () {
      video.play().catch(() => {});
    });
    currentHls.on(Hls.Events.ERROR, function () {
      status.innerText = 'প্লে করতে সমস্যা হচ্ছে: ' + ch.name;
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support for Safari / iOS
    video.src = ch.url;
    video.play().catch(() => {});
  } else {
    alert("আপনার ব্রাউজারে HLS প্লেয়ার সাপোর্ট করে না।");
  }
      }
