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
let currentChannel = null;
let currentChannelElement = null;

let userListener = null;
let expiryCheckInterval = null;

// Auto-Refresh & Error Recovery Variables
let stallTimeoutTimer = null;
let lastPlayedTime = 0;
let stallCheckInterval = null;

// Format phone into synthetic email
function phoneToEmail(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  return `${clean}@streamx.com`;
}

// Show/Hide Player Loader Overlay
function showPlayerLoader(text = "স্ট্রিম লোড হচ্ছে...") {
  const loader = document.getElementById('playerLoader');
  const loaderText = document.getElementById('loaderText');
  if (loader && loaderText) {
    loaderText.innerText = text;
    loader.style.display = 'flex';
  }
}

function hidePlayerLoader() {
  const loader = document.getElementById('playerLoader');
  if (loader) loader.style.display = 'none';
}

// Complete Player Teardown
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
  if (stallCheckInterval) clearInterval(stallCheckInterval);
  if (stallTimeoutTimer) clearTimeout(stallTimeoutTimer);
  hidePlayerLoader();
}

// ==================== AUTHENTICATION TABS ====================
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

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      phone: phone,
      email: email,
      subscription: { status: "expired", expiry: 0 },
      createdAt: serverTimestamp()
    });

    msgEl.style.color = "#38ef7d";
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
    msgEl.style.color = "#38ef7d";
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

// ==================== REALTIME SUBSCRIPTION WATCHER ====================
onAuthStateChanged(auth, (user) => {
  const authScreen = document.getElementById("authScreen");
  const subScreen = document.getElementById("subScreen");
  const mainApp = document.getElementById("mainApp");

  if (userListener) userListener();
  if (expiryCheckInterval) clearInterval(expiryCheckInterval);

  if (user) {
    currentUser = user;
    authScreen.style.display = "none";

    userListener = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const sub = userData?.subscription || {};
      const now = Date.now();

      if (sub.status === "active" && sub.expiry && sub.expiry > now) {
        subScreen.style.display = "none";
        mainApp.style.display = "flex";

        loadChannels(currentCategory);

        if (expiryCheckInterval) clearInterval(expiryCheckInterval);
        expiryCheckInterval = setInterval(() => {
          if (Date.now() >= sub.expiry) {
            clearInterval(expiryCheckInterval);
            updateDoc(doc(db, "users", user.uid), { "subscription.status": "expired" });
            revokeAccess("আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে!");
          }
        }, 3000);

      } else {
        revokeAccess("আপনার কোনো সক্রিয় সাবস্ক্রিপশন নেই!");
      }
    });

  } else {
    currentUser = null;
    stopVideoPlayer();
    authScreen.style.display = "flex";
    subScreen.style.display = "none";
    mainApp.style.display = "none";
  }
});

function revokeAccess(reasonMessage) {
  stopVideoPlayer();
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("subScreen").style.display = "flex";
  if (reasonMessage) {
    document.getElementById("subMessage").innerText = reasonMessage;
  }
  loadPackages();
}

// ==================== SUBSCRIPTION & PACKAGES ====================
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
          <div class="package-card" tabindex="0" onclick="selectPackage('${id}', '${pkg.name}', ${pkg.price}, ${pkg.durationDays})">
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

    alert("পেমেন্ট রিকোয়েস্ট জমা দেওয়া হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে স্ট্রিম চালু হবে।");
    document.getElementById("trxIdInput").value = "";
    cancelPaymentSelect();
  } catch (error) {
    msgEl.innerText = "এরর: " + error.message;
  }
};

// ==================== CHANNELS & PLAYBACK ENGINE ====================
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

  const q = query(collection(db, "channels"), where("category", "==", category));

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
        div.tabIndex = 0; // Android TV Remote Focus
        div.innerHTML = `
          ${ch.logo ? `<img src="${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">` : ''}
          <div class="channel-name">${ch.name}</div>
        `;
        div.onclick = () => playChannel(ch, div);
        div.addEventListener('keypress', (e) => { if (e.key === 'Enter') playChannel(ch, div); });
        list.appendChild(div);
      }
    });

    status.innerText = `${category.toUpperCase()} • ${count} টি চ্যানেল`;
  });
}

// Core Playback Function with Smart TV & Auto-Recovery Logic
function playChannel(ch, element) {
  if (!ch || !ch.url) {
    alert('চ্যানেলের স্ট্রিম URL পাওয়া যায়নি');
    return;
  }

  currentChannel = ch;
  currentChannelElement = element;

  document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
  if (element) element.classList.add('active');

  const video = document.getElementById('player');
  const status = document.getElementById('status');

  status.innerText = 'প্লে হচ্ছে: ' + ch.name;
  showPlayerLoader('স্ট্রিম কানেক্ট করা হচ্ছে...');

  if (stallCheckInterval) clearInterval(stallCheckInterval);

  if (Hls.isSupported()) {
    if (currentHls) {
      currentHls.destroy();
    }

    currentHls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 4,
      levelLoadingTimeOut: 10000
    });

    currentHls.loadSource(ch.url);
    currentHls.attachMedia(video);

    currentHls.on(Hls.Events.MANIFEST_PARSED, function () {
      hidePlayerLoader();
      video.play().catch(() => {});
    });

    // Smart Recovery on HLS Network or Media Errors
    currentHls.on(Hls.Events.ERROR, function (event, data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            status.innerText = 'নেটওয়ার্ক সমস্যা! পুনঃরায় কানেক্ট করা হচ্ছে...';
            showPlayerLoader('পুনরায় কানেক্ট হচ্ছে...');
            currentHls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            status.innerText = 'স্ট্রিম রিকভার করা হচ্ছে...';
            currentHls.recoverMediaError();
            break;
          default:
            status.innerText = 'স্ট্রিম সমস্যা! রিফ্রেশ হচ্ছে...';
            setTimeout(() => playChannel(currentChannel, currentChannelElement), 2500);
            break;
        }
      }
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari / Smart TV Native HLS Fallback
    video.src = ch.url;
    video.play().catch(() => {});
    hidePlayerLoader();
  } else {
    hidePlayerLoader();
    alert("আপনার ব্রাউজারে HLS সাপোর্ট নেই।");
    return;
  }

  // Setup Continuous Monitoring to Detect Freeze/Stall
  lastPlayedTime = video.currentTime;
  stallCheckInterval = setInterval(() => {
    if (!video.paused && !video.ended) {
      if (video.currentTime === lastPlayedTime) {
        showPlayerLoader('ইন্টারনেট ধীরগতির কারণে বাফার হচ্ছে...');
        // Auto reload after 8 seconds of continuous freeze
        if (!stallTimeoutTimer) {
          stallTimeoutTimer = setTimeout(() => {
            status.innerText = 'অটোমেটিক রিফ্রেশ হচ্ছে...';
            forceReloadCurrentStream();
          }, 8000);
        }
      } else {
        hidePlayerLoader();
        if (stallTimeoutTimer) {
          clearTimeout(stallTimeoutTimer);
          stallTimeoutTimer = null;
        }
      }
      lastPlayedTime = video.currentTime;
    }
  }, 2000);
}

// Manual or Auto Forced Reload
window.forceReloadCurrentStream = function() {
  if (currentChannel) {
    showPlayerLoader('স্ট্রিম রিফ্রেশ করা হচ্ছে...');
    playChannel(currentChannel, currentChannelElement);
  } else {
    alert("আগে যেকোনো একটি চ্যানেল চালু করুন।");
  }
};
