// ================= CONFIGURATION & GLOBAL ECOSYSTEM STATES =================
const firebaseConfig = {
    apiKey: "AIzaSyA-6ZngcQRagHV3MEtTUoYoyfZgT8OqaF4",
    databaseURL: "https://nazim-8c4cf-default-rtdb.firebaseio.com",
    projectId: "nazim-8c4cf",
    storageBucket: "nazim-8c4cf.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dhib5t6me/image/upload";
const CLOUDINARY_PRESET = "Naeeem";

let sessionUser = null;
let globalSystemPlans = {};
let activeAuditFilter = 'all';
let maintenanceCountdownInterval = null;

let wrongAttemptCounter = 0;
let adminCoinsValueExchangeRate = 50; 
let globalDefaultFreeWithdraws = 1; 

// Double Auth Variables
let daCameraStream = null;

// ================= SYSTEM INITIALIZATION ROUTINES =================
window.addEventListener('DOMContentLoaded', () => {
    initClockTrackingEngine();
    detectAndRegisterDeviceSignature();
    streamGlobalMetaParameters();
    evaluateLocalCacheSession();
    streamMaintenanceTrackerModule();
    streamPopupAnnouncementsPipeline();
    listenToGlobalAdminCoinsConfiguration();
    initPolicyCheck();
    initSlimLiveFeed();
    
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if(refParam) {
        const refInput = document.getElementById('signup-ref');
        if(refInput) refInput.value = refParam.toUpperCase();
    }
});

// Toggle Three Dots Menu
function toggleThreeDotsMenu() {
    const menu = document.getElementById('three-dots-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('dropdown-active');
    } else {
        menu.classList.add('hidden');
        menu.classList.remove('dropdown-active');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('three-dots-menu');
    const pill = document.getElementById('device-pill');
    if (!menu.classList.contains('hidden') && !menu.contains(event.target) && !pill.contains(event.target)) {
        menu.classList.add('hidden');
        menu.classList.remove('dropdown-active');
    }
});

function initClockTrackingEngine() {
    const timeNode = document.getElementById('header-time');
    const dateNode = document.getElementById('header-date');
    
    setInterval(() => {
        const now = new Date();
        timeNode.innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        dateNode.innerText = now.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'});
    }, 1000);
}

// === NEW: SLIM LIVE FEED TICKER ===
function initSlimLiveFeed() {
    const feedEl = document.getElementById('slim-live-feed');
    if(!feedEl) return;
    
    const firstNames = ['Al***i', 'Us***n', 'Ah***d', 'Fa***a', 'Za***r', 'No***m', 'Sh***a', 'Wa***s', 'Bi***l'];
    const actions = [
        () => `Withdrew Rs.${Math.floor(Math.random()*50)*100 + 500} via JazzCash`,
        () => `Withdrew Rs.${Math.floor(Math.random()*50)*100 + 500} via EasyPaisa`,
        () => `Activated Level ${Math.floor(Math.random()*4)+1} Plan`,
        () => `Earned +${Math.floor(Math.random()*50)+10} Coins Profit`,
        () => `Deposited Rs.${Math.floor(Math.random()*20)*500 + 1000}`
    ];
    
    setInterval(() => {
        const name = firstNames[Math.floor(Math.random() * firstNames.length)];
        const action = actions[Math.floor(Math.random() * actions.length)]();
        feedEl.innerText = `${name} ${action}`;
        
        // Retrigger animation
        feedEl.classList.remove('feed-animate');
        void feedEl.offsetWidth; // Trigger reflow
        feedEl.classList.add('feed-animate');
    }, 4500);
}

// === NEW: DAILY BONUS SYSTEM ===
function claimDailyBonusReward() {
    if(!sessionUser) return;
    const now = Date.now();
    const lastClaim = sessionUser.lastDailyBonus || 0;
    const cooldown = 24 * 60 * 60 * 1000;
    
    if (now - lastClaim < cooldown) {
        const diff = cooldown - (now - lastClaim);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        triggerSystemToast(`Daily limit reached. Available in ${h}h ${m}m!`, 'error');
        return;
    }
    
    const rewards = [5, 10, 15, 20, 0];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const cachedPhone = localStorage.getItem('ph_session_phone');
    
    db.ref(`users/${cachedPhone}`).transaction(current => {
        if(current) {
            current.lastDailyBonus = now;
            if(reward > 0) {
                current.coinsCommission = (parseInt(current.coinsCommission) || 0) + reward;
                if(!current.logs) current.logs = {};
                const logId = 'LOG-BONUS-' + now;
                current.logs[logId] = {
                    id: logId, type: 'bonus', title: 'Daily Free Reward',
                    amount: reward, timestamp: now, status: 'Success'
                };
            }
        }
        return current;
    }, (err, committed) => {
        if(committed) {
            if(reward > 0) triggerSystemToast(`🎉 Claimed ${reward} Coins!`, 'success');
            else triggerSystemToast(`Empty box today! Try again tomorrow.`, 'info');
            
            checkDailyBonusState();
        }
    });
}

function checkDailyBonusState() {
    const btn = document.getElementById('daily-reward-btn');
    if(!btn || !sessionUser) return;
    
    const now = Date.now();
    const lastClaim = sessionUser.lastDailyBonus || 0;
    const cooldown = 24 * 60 * 60 * 1000;
    
    if(now - lastClaim < cooldown) {
        btn.innerHTML = `<i class="fa-solid fa-clock"></i> Next Reward Tomorrow`;
        btn.classList.remove('daily-reward-btn', 'text-amber-400');
        btn.classList.add('text-gray-500');
    } else {
        btn.innerHTML = `<i class="fa-solid fa-gift text-lg animate-pulse"></i> Claim Your Daily Reward`;
        btn.classList.add('daily-reward-btn', 'text-amber-400');
        btn.classList.remove('text-gray-500');
    }
}

function detectAndRegisterDeviceSignature() {
    let signature = localStorage.getItem('ph_device_signature');
    if(!signature) {
        signature = 'PH-NODE-' + Math.random().toString(36).substring(2, 11).toUpperCase();
        localStorage.setItem('ph_device_signature', signature);
    }
    window.deviceSignature = signature;
    
    document.getElementById('context-device-name').innerText = signature;
    document.getElementById('device-display-name').innerText = signature;

    db.ref('users').once('value', snapshot => {
        if(snapshot.exists()) {
            let connectedAccountFound = null;
            let activeCachedSession = localStorage.getItem('ph_session_phone');
            
            snapshot.forEach(child => {
                let val = child.val();
                if(val.registeredDevice === signature) {
                    connectedAccountFound = child.key;
                }
            });

            if(connectedAccountFound && activeCachedSession !== connectedAccountFound) {
                localStorage.setItem('ph_session_phone', connectedAccountFound);
                evaluateLocalCacheSession();
            }
        }
    });
}

function triggerSystemToast(message, type = 'info') {
    const container = document.getElementById('global-toast-container');
    const toast = document.createElement('div');
    toast.className = `glass-card p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 transition-all duration-300 transform scale-95 opacity-0 border-l-4 pointer-events-auto bg-slate-900/90 ${
        type === 'success' ? 'border-emerald-500 text-emerald-200 shadow-emerald-950/20' :
        type === 'error' ? 'border-rose-500 text-rose-200 shadow-rose-950/20' : 'border-amber-500 text-amber-200 shadow-amber-950/20'
    }`;
    
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon} text-base flex-shrink-0 text-amber-400"></i><span class="text-xs font-bold leading-relaxed">${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('scale-95', 'opacity-0'); }, 50);
    
    setTimeout(() => {
        toast.classList.add('scale-95', 'opacity-0');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function switchScreen(screenId) {
    if(daCameraStream && screenId !== 'screen-double-auth-challenge') {
        stopDoubleAuthCamera();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (screenId === 'screen-withdraw') {
            if (sessionUser && !sessionUser.withdrawPin) {
                document.getElementById('pin-setup-modal').classList.remove('hidden');
            }
            setTimeout(() => {
                buildWithdrawalAccountConfigPanel();
            }, 50);
            const today = new Date();
            if (today.getDay() === 0) { 
                setTimeout(() => {
                    const withdrawBtn = document.getElementById('withdraw-submit-btn');
                    if (withdrawBtn) {
                        withdrawBtn.disabled = true;
                        withdrawBtn.innerHTML = 'Withdrawals Blocked on Sunday';
                        withdrawBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                }, 300);
            }
        }
        
        if (screenId === 'screen-my-details' && typeof synchronizeUserDashboardInterface === 'function') {
            setTimeout(() => {
                synchronizeUserDashboardInterface();
            }, 10);
        }

        if (screenId === 'screen-history' && typeof loadUserFullHistory === 'function') {
            setTimeout(() => {
                loadUserFullHistory();
            }, 50);
        }

        if (screenId === 'screen-tasks' && typeof loadUserSocialChannels === 'function') {
            setTimeout(() => {
                loadUserSocialChannels();
            }, 80);
        }

        if (sessionUser && typeof initApprovalNotificationListener === 'function') {
            setTimeout(initApprovalNotificationListener, 800);
        }
    }
}

// ================= REFERRAL TIERS SYSTEM =================
function calculateTier(refCount) {
    let tier = Math.floor(refCount / 10) + 1;
    if (tier > 10) tier = 10; 
    let commissionMultiplier = 1 + ((tier - 1) * 0.1); 
    let tierName = `Level ${tier}`;
    if (tier >= 10) tierName = `Gold Level`;
    return { tier, tierName, commissionMultiplier };
}

function updateAffiliateTierDisplay() {
    if(!sessionUser) return;
    let validRefs = 0;
    if (sessionUser.referrals) {
        Object.values(sessionUser.referrals).forEach(ref => {
            if (ref.isDeposited === true || ref.depositCommissionPaid === true) {
                validRefs++;
            }
        });
    }
    
    const tierData = calculateTier(validRefs);
    const tierNameEl = document.getElementById('affiliate-tier-name');
    const tierBadge = document.getElementById('affiliate-tier-badge');
    
    if (tierNameEl) {
        tierNameEl.innerText = tierData.tierName;
        if(tierData.tier >= 10) {
            tierBadge.className = "mt-2 mb-3 mx-auto max-w-[200px] py-1.5 px-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.6)] flex items-center justify-center gap-2 border border-yellow-300 animate-pulse";
        } else {
            tierBadge.className = "mt-2 mb-3 mx-auto max-w-[200px] py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-lg flex items-center justify-center gap-2 border border-emerald-400";
        }
    }
    return tierData;
}


// ================= WITHDRAW PIN SYSTEM =================
function handlePinSetup(e) {
    e.preventDefault();
    const pin = document.getElementById('setup-pin-val').value;
    const dob = document.getElementById('setup-pin-dob').value;
    
    if(!pin || !dob) return;

    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`users/${cachedPhone}`).update({
        withdrawPin: pin,
        dob: dob
    }, err => {
        if(!err) {
            triggerSystemToast("Withdrawal PIN securely saved.", "success");
            document.getElementById('pin-setup-modal').classList.add('hidden');
        }
    });
}

function openPinResetModal() {
    document.getElementById('pin-reset-modal').classList.remove('hidden');
    document.getElementById('reset-pin-dob').value = '';
    document.getElementById('reset-new-pin').value = '';
    document.getElementById('new-pin-section').classList.add('hidden');
    document.getElementById('btn-save-new-pin').classList.add('hidden');
    document.getElementById('btn-verify-dob').classList.remove('hidden');
}

function closePinResetModal() {
    document.getElementById('pin-reset-modal').classList.add('hidden');
}

function verifyDobForPin() {
    const inputDob = document.getElementById('reset-pin-dob').value;
    if(!inputDob) {
        triggerSystemToast("Please enter your DOB.", "error");
        return;
    }
    
    if(sessionUser.dob === inputDob) {
        triggerSystemToast("DOB Verified. Set new PIN.", "success");
        document.getElementById('new-pin-section').classList.remove('hidden');
        document.getElementById('btn-save-new-pin').classList.remove('hidden');
        document.getElementById('btn-verify-dob').classList.add('hidden');
    } else {
        triggerSystemToast("Incorrect Date of Birth.", "error");
    }
}

function handlePinReset(e) {
    e.preventDefault();
    const newPin = document.getElementById('reset-new-pin').value;
    if(!newPin || newPin.length !== 4) {
        triggerSystemToast("Invalid 4-digit PIN.", "error");
        return;
    }

    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`users/${cachedPhone}`).update({
        withdrawPin: newPin
    }, err => {
        if(!err) {
            triggerSystemToast("Withdrawal PIN reset successful.", "success");
            closePinResetModal();
        }
    });
}


// ================= DOUBLE AUTHENTICATION SYSTEM =================
async function startDoubleAuthCamera(videoId) {
    try {
        daCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const videoEl = document.getElementById(videoId);
        videoEl.srcObject = daCameraStream;
        videoEl.play();
    } catch (err) {
        triggerSystemToast("Camera access is required for Double Verification.", "error");
    }
}

function stopDoubleAuthCamera() {
    if(daCameraStream) {
        daCameraStream.getTracks().forEach(t => t.stop());
        daCameraStream = null;
    }
}

function captureImageFromVideo(videoId, canvasId) {
    const video = document.getElementById(videoId);
    const canvas = document.getElementById(canvasId);
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.4); 
}

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
}

function openDoubleAuthSetup() {
    document.getElementById('double-auth-setup-modal').classList.remove('hidden');
    const toggle = document.getElementById('da-toggle-input');
    const statusText = document.getElementById('da-status-text');
    const cameraSection = document.getElementById('da-setup-camera-section');
    
    if(sessionUser && sessionUser.doubleAuthEnabled) {
        toggle.checked = true;
        statusText.innerText = "ENABLED";
        statusText.className = "text-[9px] text-emerald-400 font-bold tracking-wider";
        cameraSection.classList.add('hidden');
    } else {
        toggle.checked = false;
        statusText.innerText = "DISABLED";
        statusText.className = "text-[9px] text-rose-400 font-bold tracking-wider";
        cameraSection.classList.add('hidden');
    }
}

function closeDoubleAuthSetup() {
    document.getElementById('double-auth-setup-modal').classList.add('hidden');
    stopDoubleAuthCamera();
}

function toggleDoubleAuthUI() {
    const toggle = document.getElementById('da-toggle-input');
    const statusText = document.getElementById('da-status-text');
    const cameraSection = document.getElementById('da-setup-camera-section');

    if(toggle.checked) {
        if(!sessionUser.baseAuthImage) {
            statusText.innerText = "PENDING SETUP";
            statusText.className = "text-[9px] text-amber-400 font-bold tracking-wider";
            cameraSection.classList.remove('hidden');
            startDoubleAuthCamera('da-setup-video');
        } else {
            statusText.innerText = "ENABLED";
            statusText.className = "text-[9px] text-emerald-400 font-bold tracking-wider";
            cameraSection.classList.add('hidden');
            db.ref(`users/${localStorage.getItem('ph_session_phone')}`).update({ doubleAuthEnabled: true });
        }
    } else {
        statusText.innerText = "DISABLED";
        statusText.className = "text-[9px] text-rose-400 font-bold tracking-wider";
        cameraSection.classList.add('hidden');
        stopDoubleAuthCamera();
        db.ref(`users/${localStorage.getItem('ph_session_phone')}`).update({ doubleAuthEnabled: false });
    }
}

async function captureBaselineImage() {
    const base64Data = captureImageFromVideo('da-setup-video', 'da-setup-canvas');
    if(!base64Data) return;
    
    document.getElementById('da-setup-camera-section').classList.add('hidden');
    document.getElementById('da-setup-loading').classList.remove('hidden');
    stopDoubleAuthCamera();

    const file = dataURLtoFile(base64Data, 'base_auth.jpg');
    const url = await transmitMediaToCloudMatrix(file);

    if(url) {
        db.ref(`users/${localStorage.getItem('ph_session_phone')}`).update({
            baseAuthImage: url,
            doubleAuthEnabled: true
        }, err => {
            if(!err) {
                triggerSystemToast("Double Verification Baseline captured successfully.", "success");
                closeDoubleAuthSetup();
                document.getElementById('da-setup-loading').classList.add('hidden');
            }
        });
    } else {
        triggerSystemToast("Upload failed. Try again.", "error");
        document.getElementById('da-setup-camera-section').classList.remove('hidden');
        document.getElementById('da-setup-loading').classList.add('hidden');
        startDoubleAuthCamera('da-setup-video');
    }
}

async function submitDoubleAuthChallenge() {
    const btn = document.getElementById('btn-submit-challenge');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
    btn.disabled = true;

    const base64Data = captureImageFromVideo('login-challenge-video', 'login-challenge-canvas');
    stopDoubleAuthCamera();
    const file = dataURLtoFile(base64Data, 'login_challenge.jpg');
    const url = await transmitMediaToCloudMatrix(file);

    if(url) {
        const phone = window.tempLoginPhone || localStorage.getItem('ph_session_phone');
        
        db.ref(`users/${phone}`).update({ verificationStatus: 'verifying' });
        
        db.ref(`admin_queues/double_auth/${phone}`).set({
            phone: phone,
            username: window.tempLoginUser ? window.tempLoginUser.username : sessionUser.username,
            oldImage: (window.tempLoginUser ? window.tempLoginUser.baseAuthImage : sessionUser.baseAuthImage) || "",
            newImage: url,
            timestamp: Date.now(),
            status: 'pending'
        }, err => {
            if(!err) {
                localStorage.setItem('ph_session_phone', phone);
                sessionUser = window.tempLoginUser || sessionUser;
                if(sessionUser) sessionUser.verificationStatus = 'verifying';

                triggerSystemToast("Live image sent to Admin. Account in temporary wait mode.", "success");
                initUserEcosystemStream();
            }
        });
    } else {
        triggerSystemToast("Upload failed.", "error");
        btn.innerHTML = `<i class="fa-solid fa-camera mr-1"></i> Start Verification Capture`;
        btn.disabled = false;
        startDoubleAuthCamera('login-challenge-video');
    }
}

// ================= NEW PLAN REQUEST SYSTEM =================
function closeNewPlanAlert() {
    document.getElementById('new-plan-alert-modal').classList.add('hidden');
}

function autoSubmitNewPlanComplaint() {
    const cachedPhone = localStorage.getItem('ph_session_phone');
    const ticketId = 'TCK-' + Math.floor(100000 + Math.random() * 900000);
    
    const payload = { 
        id: ticketId, 
        category: 'New Plan Request', 
        description: 'Do you want new plan? (User requested permission to activate a new plan while already having an active one.)', 
        proofUrl: "NONE", 
        timestamp: Date.now(), 
        status: 'Pending' 
    };

    db.ref(`support_channels/${cachedPhone}/tickets/${ticketId}`).set(payload, err => {
        if(!err) { 
            triggerSystemToast("New Plan request automatically sent to admin.", "success"); 
            closeNewPlanAlert();
            
            // Push to history logs
            db.ref(`users/${cachedPhone}/logs/${ticketId}`).set({
                id: ticketId, type: 'complaint', title: 'New Plan Request Submitted', timestamp: Date.now(), status: 'Pending'
            });
        }
    });
}

// ================= GENERAL ROUTINES =================

function openProfileModal() {
    if(!sessionUser) return;
    document.getElementById('prof-modal-user').innerText = sessionUser.username || 'N/A';
    document.getElementById('prof-modal-email').innerText = sessionUser.email || 'N/A';
    document.getElementById('prof-modal-phone').innerText = localStorage.getItem('ph_session_phone') || 'N/A';
    document.getElementById('prof-modal-device').innerText = sessionUser.registeredDevice || window.deviceSignature || 'Unknown Node';
    document.getElementById('profile-details-modal').classList.remove('hidden');
}
function closeProfileModal() {
    document.getElementById('profile-details-modal').classList.add('hidden');
}

async function handleDpUpdate(event) {
    const file = event.target.files[0];
    if (!file) return;

    const dashAvatar = document.getElementById('dash-user-avatar');
    const oldSrc = dashAvatar.src;
    
    dashAvatar.style.opacity = "0.4";
    triggerSystemToast("Uploading image frame to secure cloud network matrix...", "info");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        if(!response.ok) throw new Error("Cloud matrix pipeline error.");
        
        const data = await response.json();
        
        if (data.secure_url) {
            const cachedPhone = localStorage.getItem('ph_session_phone');
            await db.ref(`users/${cachedPhone}`).update({
                avatarUrl: data.secure_url
            });

            dashAvatar.src = data.secure_url;
            triggerSystemToast("Profile picture secure matrix link synced!", "success");
        }
    } catch (error) {
        console.error("Upload signature crash:", error);
        dashAvatar.src = oldSrc;
        triggerSystemToast("Media distribution node upload failure.", "error");
    } finally {
        dashAvatar.style.opacity = "1";
    }
}

function streamMaintenanceTrackerModule() {
    db.ref('admin_settings/maintenance').on('value', snap => {
        if(snap.exists() && snap.val().active === true) {
            const data = snap.val();
            document.getElementById('maintenance-note').innerText = data.note || "Platform structural optimizations active.";
            document.getElementById('maintenance-timestamp-footer').innerText = `System Lock Latency Epoch: ${data.timestamp || new Date().toLocaleTimeString()}`;
            
            document.getElementById('top-security-alert').classList.add('hidden');
            document.getElementById('main-header').classList.add('hidden');
            document.getElementById('main-footer').classList.add('hidden');
            
            switchScreen('screen-maintenance');

            if(maintenanceCountdownInterval) clearInterval(maintenanceCountdownInterval);
            if(data.targetTimestamp) {
                const targetTime = parseInt(data.targetTimestamp);
                maintenanceCountdownInterval = setInterval(() => {
                    const now = Date.now();
                    const diff = targetTime - now;
                    if(diff <= 0) {
                        document.getElementById('maintenance-countdown').innerText = "00h 00m 00s";
                        clearInterval(maintenanceCountdownInterval);
                    } else {
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        document.getElementById('maintenance-countdown').innerText = 
                            `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
                    }
                }, 1000);
            } else {
                document.getElementById('maintenance-countdown').innerText = "Processing...";
            }
        } else {
            document.getElementById('top-security-alert').classList.remove('hidden');
            document.getElementById('main-header').classList.remove('hidden');
            document.getElementById('main-footer').classList.remove('hidden');
            if(maintenanceCountdownInterval) clearInterval(maintenanceCountdownInterval);
            if(sessionUser && sessionUser.verificationStatus !== 'suspended' && sessionUser.verificationStatus !== 'verifying') {
                switchScreen('screen-dashboard');
            }
        }
    });
}

function listenToGlobalAdminCoinsConfiguration() {
    db.ref('admin_settings/coins_per_rupee').on('value', snap => {
        if(snap.exists()) {
            adminCoinsValueExchangeRate = parseInt(snap.val());
        } else {
            adminCoinsValueExchangeRate = 50; 
        }
        const rateText = document.getElementById('matrix-exchange-rate-text');
        if(rateText) rateText.innerText = `${adminCoinsValueExchangeRate} Coins = Rs. 1`;
    });
}

// --- PASSWORD RECOVERY LOGIC ---
function openPasswordRecoveryModal() {
    document.getElementById('password-recovery-modal').classList.remove('hidden');
    resetRecoveryModal();
}

function closePasswordRecoveryModal() {
    document.getElementById('password-recovery-modal').classList.add('hidden');
}

function toggleRecoveryInput() {
    const method = document.getElementById('recovery-method-select').value;
    const label = document.getElementById('recovery-input-label');
    const input = document.getElementById('recovery-input-val');
    if(method === 'number') {
        label.innerText = 'Enter Registered Phone Number';
        input.placeholder = '03XXXXXXXXX';
        input.type = 'tel';
    } else {
        label.innerText = 'Enter Registered Gmail';
        input.placeholder = 'name@domain.com';
        input.type = 'email';
    }
}

function resetRecoveryModal() {
    document.getElementById('step-1-recovery').classList.remove('hidden');
    document.getElementById('step-2-scan').classList.add('hidden');
    document.getElementById('step-3-whatsapp').classList.add('hidden');
    document.getElementById('step-4-wait').classList.add('hidden');
    document.getElementById('recovery-input-val').value = '';
    document.getElementById('recovery-whatsapp-num').value = '';
}

function startRecoveryScan() {
    const val = document.getElementById('recovery-input-val').value.trim();
    const method = document.getElementById('recovery-method-select').value;
    if(!val) {
        triggerSystemToast("Please enter a valid detail.", "error");
        return;
    }
    
    document.getElementById('step-1-recovery').classList.add('hidden');
    document.getElementById('step-2-scan').classList.remove('hidden');
    
    let timeLeft = 10;
    const timerEl = document.getElementById('scan-timer');
    const barEl = document.getElementById('scan-progress-bar');
    
    timerEl.innerText = timeLeft;
    barEl.style.width = '0%';
    
    let userRecordFound = null;
    let userPhoneKey = null;

    db.ref('users').once('value', snapshot => {
        snapshot.forEach(child => {
            let d = child.val();
            if(method === 'number' && child.key === val) {
                userRecordFound = d;
                userPhoneKey = child.key;
            }
            if(method === 'gmail' && d.email === val) {
                userRecordFound = d;
                userPhoneKey = child.key;
            }
        });
    });

    const scanInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        barEl.style.width = ((10 - timeLeft) * 10) + '%';
        
        if(timeLeft <= 0) {
            clearInterval(scanInterval);
            document.getElementById('step-2-scan').classList.add('hidden');
            if(userRecordFound) {
                window.tempRecoveryUser = userRecordFound;
                window.tempRecoveryPhone = userPhoneKey;
                document.getElementById('step-3-whatsapp').classList.remove('hidden');
            } else {
                triggerSystemToast("Account not found with provided details.", "error");
                resetRecoveryModal();
            }
        }
    }, 1000);
}

function submitWhatsappRecovery() {
    const waNum = document.getElementById('recovery-whatsapp-num').value.trim();
    if(!waNum) {
        triggerSystemToast("Enter your active WhatsApp number.", "error");
        return;
    }
    
    const queueId = 'REC-' + Date.now();
    
    db.ref(`admin_queues/password_requests/${queueId}`).set({
        id: queueId,
        email: window.tempRecoveryUser.email,
        phone: window.tempRecoveryPhone,
        whatsappProvided: waNum,
        username: window.tempRecoveryUser.username,
        foundPassword: window.tempRecoveryUser.password,
        timestamp: Date.now(),
        status: 'pending'
    }, err => {
        if(!err) {
            document.getElementById('step-3-whatsapp').classList.add('hidden');
            document.getElementById('step-4-wait').classList.remove('hidden');
        }
    });
}

// --- KYC LOGIC ---
function openKYCModal() {
    document.getElementById('kyc-modal').classList.remove('hidden');
}

function closeKYCModal() {
    document.getElementById('kyc-modal').classList.add('hidden');
}

function submitKYC(e) {
    e.preventDefault();
    const name = document.getElementById('kyc-fullname').value.trim();
    const dob = document.getElementById('kyc-dob').value.trim();
    if(!name || !dob) return;
    
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`users/${cachedPhone}`).update({
        kycStatus: 'pending',
        dob: dob, 
        kycDetails: {
            fullName: name,
            birthday: dob,
            submittedAt: Date.now()
        }
    }, err => {
        if(!err) {
            db.ref(`admin_queues/kyc_requests/${cachedPhone}`).set({
                phone: cachedPhone,
                username: sessionUser.username,
                fullName: name,
                birthday: dob,
                timestamp: Date.now(),
                status: 'pending'
            });
            
            triggerSystemToast("KYC details submitted! Waiting for Admin verification.", "success");
            closeKYCModal();
        }
    });
}

// --- POLICY LOGIC ---
function initPolicyCheck() {
    const accepted = localStorage.getItem('ph_policy_accepted');
    if(!accepted) {
        document.getElementById('policy-slim-card').classList.remove('hidden');
    }
}
function openPolicyModal() {
    document.getElementById('policy-modal').classList.remove('hidden');
}
function acceptPolicy() {
    localStorage.setItem('ph_policy_accepted', 'true');
    document.getElementById('policy-modal').classList.add('hidden');
    document.getElementById('policy-slim-card').classList.add('hidden');
    triggerSystemToast("Policy Accepted.", "success");
}

// --- FORCED FEEDBACK LOGIC ---
function listenForAdminForcedFeedback() {
    db.ref('admin_settings/forced_feedback').on('value', snap => {
        if(snap.exists() && snap.val().active === true) {
            const snapVal = snap.val();
            const fbId = snapVal.id || 'DEFAULT_FB_ID';
            const fbDone = localStorage.getItem('ph_forced_fb_done_' + fbId);
            
            if(!fbDone) {
                triggerForcedFeedback(fbId);
            }
        } else {
            document.getElementById('forced-feedback-popup').classList.add('hidden');
        }
    });
}

function triggerForcedFeedback(fbId) {
    window.activeForcedFbId = fbId;
    const modal = document.getElementById('forced-feedback-popup');
    if (!modal.classList.contains('hidden')) return;
    
    const btn = document.getElementById('forced-fb-btn');
    const timerEl = document.getElementById('forced-fb-timer');
    
    modal.classList.remove('hidden');
    btn.disabled = true;
    let time = 10;
    timerEl.innerText = `Wait ${time}s`;
    btn.innerText = `Please Wait... (${time}s)`;
    
    if (window.forcedFbInterval) clearInterval(window.forcedFbInterval);
    
    window.forcedFbInterval = setInterval(() => {
        time--;
        timerEl.innerText = `Wait ${time}s`;
        btn.innerText = `Please Wait... (${time}s)`;
        if(time <= 0) {
            clearInterval(window.forcedFbInterval);
            btn.disabled = false;
            btn.innerText = 'Submit Feedback';
            timerEl.innerText = 'Ready';
            btn.classList.remove('bg-slate-800', 'text-gray-500', 'cursor-not-allowed');
            btn.classList.add('bg-gradient-to-r', 'from-teal-600', 'to-emerald-600', 'text-white', 'cursor-pointer');
        }
    }, 1000);
}

function submitForcedFeedback() {
    const val = document.getElementById('forced-fb-input').value.trim();
    if(!val) {
        triggerSystemToast("Please write your feedback first.", "error");
        return;
    }
    
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`admin_feedbacks/${cachedPhone}/FORCED-${Date.now()}`).set({
        id: 'FORCED-' + Date.now(),
        userPhone: cachedPhone,
        username: sessionUser.username,
        text: val,
        timestamp: Date.now(),
        adminReply: ''
    });

    localStorage.setItem('ph_forced_fb_done_' + window.activeForcedFbId, 'true');
    document.getElementById('forced-feedback-popup').classList.add('hidden');
    triggerSystemToast("Thank you for your valuable feedback!", "success");
}

function executeCoinsToRupeesConversion() {
    if(!sessionUser) return;
    let currentCoins = parseInt(sessionUser.coinsCommission || 0);
    
    if(currentCoins < adminCoinsValueExchangeRate) {
        triggerSystemToast(`Insufficient volume. Minimum required amount is ${adminCoinsValueExchangeRate} Coins.`, "error");
        return;
    }

    let conversionRupeesGained = parseFloat((currentCoins / adminCoinsValueExchangeRate).toFixed(2));
    const cachedPhone = localStorage.getItem('ph_session_phone');
    
    db.ref('users/' + cachedPhone).transaction(current => {
        if(current) {
            current.coinsCommission = 0;
            current.balance = Number(current.balance || 0) + conversionRupeesGained;
            
            if(!current.logs) current.logs = {};
            const logId = 'LOG-CONV-' + Date.now();
            current.logs[logId] = {
                id: logId,
                type: 'yield',
                title: `Converted ${currentCoins} Affiliate Coins to Balance`,
                amount: conversionRupeesGained,
                timestamp: Date.now(),
                status: 'Success'
            };
        }
        return current;
    }, (err, committed) => {
        if(committed) {
            triggerSystemToast(`Successfully exchanged coins. Added Rs. ${conversionRupeesGained} into core balance wallet.`, "success");
        }
    });
}

function toggleAuthTabs(target) {
    const loginTab = document.getElementById('tab-login-btn');
    const signupTab = document.getElementById('tab-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if(target === 'login') {
        loginTab.className = "w-1/2 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl bg-white/10 text-white transition-all flupy-btn border border-amber-500/30";
        signupTab.className = "w-1/2 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl text-gray-400 transition-all flupy-btn";
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.className = "w-1/2 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl bg-white/10 text-white transition-all flupy-btn border border-amber-500/30";
        loginTab.className = "w-1/2 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl text-gray-400 transition-all flupy-btn";
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

function checkUsernameAvailability(user) {
    const feedback = document.getElementById('username-feedback');
    const submitBtn = document.getElementById('signup-submit-btn');
    const sanitized = user.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if(sanitized.length < 3) {
        feedback.className = "text-[11px] mt-1.5 text-amber-400 font-semibold";
        feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i>Too short unique node framing identifier.`;
        feedback.classList.remove('hidden');
        submitBtn.disabled = true;
        return;
    }

    db.ref('users').orderByChild('username').equalTo(sanitized).once('value', snapshot => {
        if(snapshot.exists()) {
            feedback.className = "text-[11px] mt-1.5 text-rose-400 font-semibold";
            feedback.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i>Unavailable identifier. Suggestion: ${sanitized + Math.floor(100+Math.random()*900)}`;
            feedback.classList.remove('hidden');
            submitBtn.disabled = true;
        } else {
            feedback.className = "text-[11px] mt-1.5 text-emerald-400 font-semibold";
            feedback.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>System Registry Identifier Available.`;
            feedback.classList.remove('hidden');
            validateFormState();
        }
    });
}

function validateRealEmail(email) {
    const feedback = document.getElementById('email-feedback');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isFake = email.includes('mailinator') || email.includes('yopmail') || email.includes('tempmail');
    
    if(!re.test(email) || isFake) {
        feedback.classList.remove('hidden');
    } else {
        feedback.classList.add('hidden');
        validateFormState();
    }
}

function evaluatePasswordStrength(pass) {
    const feedback = document.getElementById('pass-feedback');
    const points = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
    
    if(!points) {
        feedback.className = "text-[11px] mt-1.5 text-rose-400 font-bold";
        feedback.innerHTML = `<i class="fa-solid fa-circle-nodes mr-1"></i>Weak Structure: Requires >=8 chars, 1 Upper, 1 Digit.`;
    } else {
        feedback.className = "text-[11px] mt-1.5 text-emerald-400 font-bold";
        feedback.innerHTML = `<i class="fa-solid fa-shield-halved mr-1"></i>Strong Cryptographic Key Validated.`;
        validateFormState();
    }
}

function validateFormState() {
    const userValid = document.getElementById('username-feedback').classList.contains('text-emerald-400');
    const emailValid = document.getElementById('email-feedback').classList.contains('hidden');
    const passValid = document.getElementById('pass-feedback').classList.contains('text-emerald-400');
    const phone = document.getElementById('signup-phone').value.trim();
    
    const submitBtn = document.getElementById('signup-submit-btn');
    submitBtn.disabled = !(userValid && emailValid && passValid && phone.length > 9);
    if(!submitBtn.disabled) {
        submitBtn.className = "w-full py-4 mt-2 btn-primary rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all transform active:scale-95 cursor-pointer flupy-btn";
    } else {
        submitBtn.className = "w-full py-4 mt-2 bg-slate-800 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-not-allowed transition-all shadow-lg flupy-btn";
    }
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-user').value.trim().toLowerCase();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-pass').value;
    const refCodeInput = document.getElementById('signup-ref').value.trim();

    db.ref('users').once('value', mainSnapshot => {
        let duplicateFound = false;

        mainSnapshot.forEach(child => {
            const node = child.val();
            if(node.email === email || node.phone === phone) {
                duplicateFound = true;
            }
        });

        if(duplicateFound) {
            const fakePayload = {
                username: username, email: email, phone: phone, password: password,
                verificationStatus: 'suspended', registeredDevice: window.deviceSignature,
                registeredDate: new Date().toLocaleDateString()
            };
            db.ref('users/' + phone).set(fakePayload);
            sessionUser = fakePayload;
            handleSuspensionStateActivation();
            triggerSystemToast("Anti-Fraud Mechanism Intercepted Parameter Duplication.", "error");
            return;
        }

        let parentRefNodePhone = null;
        if(refCodeInput) {
            mainSnapshot.forEach(uChild => {
                const profile = uChild.val();
                const generatedRefCode = profile.myRefCode || (profile.username ? profile.username.toUpperCase() + '99' : '');
                if(generatedRefCode === refCodeInput.toUpperCase()) {
                    parentRefNodePhone = uChild.key;
                }
            });

            if(!parentRefNodePhone) {
                triggerSystemToast("Invalid or inactive affiliate network signature code.", "error");
                return;
            }
        }

        const myUniqueRef = username.toUpperCase() + '99';
        const payload = {
            username: username, email: email, phone: phone, password: password,
            myRefCode: myUniqueRef, referredByPhone: parentRefNodePhone || "NONE",
            registeredDevice: window.deviceSignature, registeredDate: new Date().toLocaleDateString(),
            verificationStatus: 'verified', kycStatus: 'unverified',
            balance: 0, coinsCommission: 0, totalInvested: 0, totalProfit: 0,
            totalDeposit: 0, totalWithdraw: 0, withdrawalAccountLocked: false,
            hasApprovedDeposit: false, withdrawalLimit: 1000, lastWithdrawalTimestamp: 0,
            freeWithdraws: globalDefaultFreeWithdraws, doubleAuthEnabled: false, withdrawPin: ""
        };

        db.ref('users/' + phone).set(payload, err => {
            if(!err) {
                if(parentRefNodePhone) {
                    db.ref(`users/${parentRefNodePhone}`).transaction(parent => {
                        if(parent) {
                            parent.coinsCommission = parseInt(parent.coinsCommission || 0) + 30;
                            if(!parent.logs) parent.logs = {};
                            const lgId = 'LOG-INV-' + Date.now();
                            parent.logs[lgId] = { id: lgId, type: 'yield', title: 'Invite Bonus (+30 Coins)', amount: 30, timestamp: Date.now(), status: 'Success' };
                            if(!parent.referrals) parent.referrals = {};
                            if(!parent.referrals[phone]) {
                                parent.referrals[phone] = { email: email, username: username, date: new Date().toLocaleDateString(), depositCommissionPaid: false, isDeposited: false, commissionEarnedCoins: 30 };
                            } else {
                                parent.referrals[phone].commissionEarnedCoins = parseInt(parent.referrals[phone].commissionEarnedCoins || 0) + 30;
                            }
                        }
                        return parent;
                    });
                }
                
                triggerSystemToast("Secure system framework architecture generated.", "success");
                sessionUser = payload;
                localStorage.setItem('ph_session_phone', phone);
                
                // Add Login Log
                const logId = 'LOG-LOGIN-' + Date.now();
                db.ref(`users/${phone}/logs/${logId}`).set({
                    id: logId, type: 'login', title: 'Account Registration & Login', timestamp: Date.now(), status: 'Success'
                });
                
                initUserEcosystemStream();
            }
        });
    });
}

function handleLogin(e) {
    e.preventDefault();
    const loginInput = document.getElementById('login-phone').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    db.ref('users').once('value', snapshot => {
        let userFound = null;
        let userKey = null;

        snapshot.forEach(child => {
            const data = child.val();
            if(child.key === loginInput || (data.username && data.username.toLowerCase() === loginInput) || (data.email && data.email.toLowerCase() === loginInput)) {
                userFound = data;
                userKey = child.key;
            }
        });

        if(!userFound) {
            triggerSystemToast("Credentials mismatch or unrecognized record block.", "error");
            trackFailedLoginAttempt();
            return;
        }
        if(userFound.password !== pass) {
            triggerSystemToast("Secure system entry validation rejection.", "error");
            trackFailedLoginAttempt();
            return;
        }

        if(userFound.verificationStatus === 'suspended') {
            localStorage.setItem('ph_session_phone', userKey);
            initUserEcosystemStream();
            return;
        }

        if (userFound.doubleAuthEnabled && userFound.verificationStatus !== 'verifying') {
            window.tempLoginUser = userFound;
            window.tempLoginPhone = userKey;
            switchScreen('screen-double-auth-challenge');
            startDoubleAuthCamera('login-challenge-video');
            return;
        } else if (userFound.verificationStatus === 'verifying') {
            localStorage.setItem('ph_session_phone', userKey);
            initUserEcosystemStream();
            return;
        }

        if (userFound.registeredDevice !== window.deviceSignature) {
            db.ref('users/' + userKey).update({ registeredDevice: window.deviceSignature });
            userFound.registeredDevice = window.deviceSignature;
        }

        sessionUser = userFound;
        localStorage.setItem('ph_session_phone', userKey);
        
        // Add Login Log
        const logId = 'LOG-LOGIN-' + Date.now();
        db.ref(`users/${userKey}/logs/${logId}`).set({
            id: logId, type: 'login', title: 'Platform Login Access', timestamp: Date.now(), status: 'Success'
        });

        triggerSystemToast("Session link initialized successfully.", "success");
        initUserEcosystemStream();
    });
}

function trackFailedLoginAttempt() {
    wrongAttemptCounter++;
    if(wrongAttemptCounter >= 1) {
        document.getElementById('forgot-password-trigger-box').classList.remove('hidden');
    }
}

function evaluateLocalCacheSession() {
    const cachedPhone = localStorage.getItem('ph_session_phone');
    if(cachedPhone) {
        db.ref('users/' + cachedPhone).once('value', snapshot => {
            if(snapshot.exists()) {
                initUserEcosystemStream();
            } else {
                localStorage.removeItem('ph_session_phone');
                switchScreen('screen-auth');
            }
        });
    } else {
        switchScreen('screen-auth');
    }
}

function terminateSession() {
    localStorage.removeItem('ph_session_phone');
    sessionUser = null;
    location.reload();
}

function handleSuspensionStateActivation() {
    document.getElementById('top-security-alert').classList.add('hidden');
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('main-footer').classList.add('hidden');
    document.getElementById('admin-custom-warning-banner').classList.add('hidden');
    
    if(sessionUser.suspensionWarning) {
        document.getElementById('suspension-warning-text').innerText = sessionUser.suspensionWarning;
    }
    switchScreen('screen-suspended');
}

function getDeviceModel() {
    const ua = navigator.userAgent;
    let model = "Mobile Secure Node";
    const patterns = [
        { regex: /Samsung|SM-[A-Z0-9]+/i, name: "Samsung Galaxy" },
        { regex: /iPhone|CPU iPhone OS/i, name: "Apple iPhone" },
        { regex: /Pixel/i, name: "Google Pixel" },
        { regex: /Redmi|Mi|POCO/i, name: "Xiaomi Link" },
        { regex: /OPPO/i, name: "OPPO Interface" },
        { regex: /vivo/i, name: "Vivo Core" },
        { regex: /Realme/i, name: "Realme Node" },
        { regex: /Infinix/i, name: "Infinix Prime" },
        { regex: /Tecno/i, name: "Tecno Machine" }
    ];
    for (let p of patterns) {
        if (p.regex.test(ua)) {
            model = p.name;
            break;
        }
    }
    const displayElement = document.getElementById('device-display-name');
    if (displayElement) displayElement.innerText = model;
}
window.addEventListener('load', getDeviceModel);

async function transmitMediaToCloudMatrix(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        if(!response.ok) throw new Error("Network cloud pipeline exception error.");
        const data = await response.json();
        return data.secure_url;
    } catch (err) {
        triggerSystemToast("Media distribution architecture node rejection.", "error");
        return null;
    }
}

function initUserEcosystemStream() {
    document.getElementById('device-pill').style.display = 'flex';
    document.getElementById('top-security-alert').classList.remove('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-footer').classList.remove('hidden');
    
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref('users/' + cachedPhone).on('value', snapshot => {
        if(!snapshot.exists()) return;
        const updated = snapshot.val();
        
        if (updated.forceLogout === true) {
            db.ref('users/' + cachedPhone).update({ forceLogout: false }).then(() => {
                terminateSession();
            });
            return;
        }

        if(updated.verificationStatus === 'suspended') {
            sessionUser = updated;
            handleSuspensionStateActivation();
            return;
        }

        if(updated.verificationStatus === 'verifying') {
            sessionUser = updated;
            document.getElementById('top-security-alert').classList.add('hidden');
            document.getElementById('main-header').classList.add('hidden');
            document.getElementById('main-footer').classList.add('hidden');
            switchScreen('screen-verifying');
            return;
        }
        
        if(sessionUser && (sessionUser.verificationStatus === 'suspended' || sessionUser.verificationStatus === 'verifying') && updated.verificationStatus === 'verified') {
            document.getElementById('top-security-alert').classList.remove('hidden');
            document.getElementById('main-header').classList.remove('hidden');
            document.getElementById('main-footer').classList.remove('hidden');
            switchScreen('screen-dashboard');
        }

        sessionUser = updated;

        const warningBanner = document.getElementById('admin-custom-warning-banner');
        const warningText = document.getElementById('admin-warning-banner-text');
        const redWarning = document.getElementById('dash-red-warning');
        const redWarningText = document.getElementById('dash-red-warning-text');
        
        if(updated.customProfileWarningText && updated.customProfileWarningText.trim() !== "") {
            redWarningText.innerText = updated.customProfileWarningText;
            redWarning.classList.remove('hidden');
            
            warningText.innerText = updated.customProfileWarningText;
            warningBanner.classList.remove('hidden');
        } else {
            redWarning.classList.add('hidden');
            warningBanner.classList.add('hidden');
        }

        synchronizeUserDashboardInterface();
    });

    streamInvestmentPlansDataset();
    streamLiveSupportMessageLogs();
    streamFiledTicketsLog();
    listenForAdminForcedFeedback();
    
    if(sessionUser && sessionUser.verificationStatus !== 'verifying' && sessionUser.verificationStatus !== 'suspended') {
        switchScreen('screen-dashboard');
    }
}

function synchronizeUserDashboardInterface() {
    document.getElementById('dash-username').innerText = sessionUser.username || 'User Node';
    
    const myRef = sessionUser.myRefCode || (sessionUser.username.toUpperCase() + '99');
    document.getElementById('dash-my-refcode').innerText = myRef;
    document.getElementById('display-invite-refcode').innerText = myRef;

    const avatar = sessionUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
    document.getElementById('dash-user-avatar').src = avatar;

    document.getElementById('meta-balance').innerText = Number(sessionUser.balance || 0).toFixed(2);
    // Updated replacing active users
    document.getElementById('dash-small-balance').innerText = "Rs. " + Number(sessionUser.balance || 0).toFixed(2);
    
    document.getElementById('meta-total-invest').innerText = Number(sessionUser.totalInvested || 0).toFixed(2);
    document.getElementById('meta-total-profit').innerText = Number(sessionUser.totalProfit || 0).toFixed(2);
    document.getElementById('meta-total-deposit').innerText = Number(sessionUser.totalDeposit || 0).toFixed(2);
    document.getElementById('meta-total-withdraw').innerText = Number(sessionUser.totalWithdraw || 0).toFixed(2);
    
    const coinsWalletNode = document.getElementById('matrix-coins-counter');
    if(coinsWalletNode) coinsWalletNode.innerHTML = `${parseInt(sessionUser.coinsCommission || 0)} <span class="text-xs text-gray-400 font-normal">Coins</span>`;

    if(sessionUser.referrals) {
        const count = Object.keys(sessionUser.referrals).length;
        document.getElementById('meta-ref-count').innerText = `${count} Node${count > 1 ? 's' : ''}`;
    } else {
        document.getElementById('meta-ref-count').innerText = "0 Nodes";
    }

    updateAffiliateTierDisplay();
    checkDailyBonusState();

    let kycStat = sessionUser.kycStatus || 'unverified';
    let statusTextNode = document.getElementById('dash-status-text');
    let statusContainer = document.getElementById('dash-status-container');
    let kycBtn = document.getElementById('kyc-action-btn');
    
    if(kycStat === 'verified') {
        statusTextNode.innerText = 'Verified Secure';
        statusContainer.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner';
        if(kycBtn) kycBtn.classList.add('hidden');
    } else if(kycStat === 'pending') {
        statusTextNode.innerText = 'KYC Pending';
        statusContainer.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner';
        if(kycBtn) kycBtn.classList.add('hidden');
    } else {
        statusTextNode.innerText = 'Unverified';
        statusContainer.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner';
        if(kycBtn) kycBtn.classList.remove('hidden');
    }

    buildActivePlanInterfaceTracker();
    buildWithdrawalAccountConfigPanel();
    renderNetworkAffiliateStructureList();
}

function streamGlobalMetaParameters() {
    db.ref('admin_settings/about_us').on('value', snap => {
        if(!snap.exists()) return;
        const data = snap.val();
        if(data.text) document.getElementById('about-us-text').innerText = data.text;
        if(data.imageUrl) document.getElementById('about-us-img').src = data.imageUrl;
    });
    
    db.ref('admin_settings/deposit_gateway').on('value', snap => {
        window.globalDepositGatewayConfig = snap.val();
        updateDepositGatewayDetails(document.getElementById('deposit-channel').value);
    });

    db.ref('admin_settings/default_free_withdraws').on('value', snap => {
        if(snap.exists()) {
            globalDefaultFreeWithdraws = parseInt(snap.val());
        } else {
            globalDefaultFreeWithdraws = 1;
        }
    });
}

function initApprovalNotificationListener() {
    if (!sessionUser || !sessionUser.phone) return;

    const phone = sessionUser.phone;

    db.ref('admin_queues/deposits').on('child_changed', snap => {
        const data = snap.val();
        if (data.userPhone === phone && data.status === 'Approved' && !data.notified) {
            showBeautifulApprovalToast('Deposit', data.amount, data.trxId);
            db.ref('admin_queues/deposits/' + snap.key).update({ notified: true });
        }
    });

    db.ref('admin_queues/withdrawals').on('child_changed', snap => {
        const data = snap.val();
        if (data.userPhone === phone && data.status === 'Approved' && !data.notified) {
            showBeautifulApprovalToast('Withdrawal', data.amount);
            db.ref('admin_queues/withdrawals/' + snap.key).update({ notified: true });
        }
    });
}

function showBeautifulApprovalToast(type, amount, trxId = '') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 z-[9999] animate-bounce`;
    toast.style.animation = 'popIn 0.4s ease';
    toast.innerHTML = `
        <div class="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
        <div>
            <div class="font-extrabold text-lg">Success!</div>
            <div class="text-sm opacity-90">Hello ${sessionUser.username || 'User'}, your ${type} of Rs. ${amount} has been successfully approved.</div>
            ${trxId ? `<div class="text-xs font-mono mt-1 opacity-75">TRX: ${trxId}</div>` : ''}
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.5s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 30px)';
        setTimeout(() => toast.remove(), 600);
    }, 6500);
}

function streamPopupAnnouncementsPipeline() {
    db.ref('admin_settings/popup_announcement').on('value', snap => {
        if(!snap.exists()) return;
        const data = snap.val();
        if(data.active === true) {
            document.getElementById('popup-ann-title').innerText = data.title || "Ecosystem Alert Directive";
            document.getElementById('popup-ann-desc').innerText = data.description || "";
            if(data.image || data.imageUrl) {
                const imgUrl = data.image || data.imageUrl;
                document.getElementById('popup-ann-img').src = imgUrl;
                document.getElementById('popup-ann-img-wrapper').classList.remove('hidden');
            } else {
                document.getElementById('popup-ann-img-wrapper').classList.add('hidden');
            }
            
            document.getElementById('global-announcement-popup').classList.remove('hidden');
            initPopupCloseTimerEngine();
        }
    });
}

function initPopupCloseTimerEngine() {
    const btn = document.getElementById('popup-ann-close-btn');
    const timerLabel = document.getElementById('announcement-timer-countdown');
    let timeRemaining = 15;

    btn.disabled = true;
    btn.className = "w-full py-3 bg-slate-800 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-not-allowed transition-all flupy-btn";
    btn.innerText = `Please Wait (${timeRemaining}s)`;
    timerLabel.innerText = `Wait ${timeRemaining}s`;

    const interval = setInterval(() => {
        timeRemaining--;
        if(timeRemaining <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.className = "w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl font-bold text-xs uppercase tracking-wider text-white cursor-pointer transition-all shadow-lg flupy-btn";
            btn.innerText = "Acknowledge Directive";
            timerLabel.innerText = "Unlocked Matrix";
        } else {
            btn.innerText = `Please Wait (${timeRemaining}s)`;
            timerLabel.innerText = `Wait ${timeRemaining}s`;
        }
    }, 1000);
}

function closeAnnouncementPopup() {
    document.getElementById('global-announcement-popup').classList.add('hidden');
}

function submitSuspensionAppeal() {
    const msg = document.getElementById('suspension-appeal-msg').value.trim();
    if(!msg) return;
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`admin_queues/appeals/${cachedPhone}`).set({
        phone: cachedPhone,
        username: sessionUser.username,
        message: msg,
        timestamp: Date.now()
    }, err => {
        if(!err) {
            triggerSystemToast("Transparent appeal parameters logged safely inside secure queue.", "success");
            document.getElementById('suspension-appeal-msg').value = '';
        }
    });
}

function streamInvestmentPlansDataset() {
    db.ref('investment_plans').on('value', snap => {
        const feed = document.getElementById('investment-plans-feed');
        feed.innerHTML = '';
        if(!snap.exists()) {
            feed.innerHTML = '<div class="text-xs text-gray-500 text-center py-6 font-medium">No strategic operational stratum plan broadcasted by admin.</div>';
            return;
        }
        
        globalSystemPlans = snap.val();
        Object.keys(globalSystemPlans).forEach(key => {
            const plan = globalSystemPlans[key];
            const row = document.createElement('div');
            row.className = "glass-panel p-4 flex flex-col justify-between items-start gap-4 border-l-4 border-emerald-500 bg-gradient-to-r from-slate-900 to-black/30 shadow-md";
            row.innerHTML = `
                <div class="w-full flex justify-between items-start">
                    <div>
                        <h4 class="text-sm font-extrabold text-white tracking-wide uppercase">${plan.name}</h4>
                        <p class="text-[10px] text-gray-400 font-semibold mt-1">Strata Lifespan: <span class="text-emerald-400 font-mono">${plan.days} Operations Days</span></p>
                        <p class="text-[9px] text-amber-400 font-black tracking-widest uppercase mt-0.5"><i class="fa-solid fa-rotate-left"></i> Better plan better life</p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-black text-emerald-400 block font-mono neon-text-emerald">${plan.percentage}% Yield</span>
                        <span class="text-[8px] text-gray-500 uppercase font-bold tracking-wider">Daily Rate Velocity</span>
                    </div>
                </div>
                <div class="w-full flex justify-between items-center pt-3 border-t border-white/5">
                    <span class="text-xs font-bold text-slate-300 font-mono">Required Stake: Rs. ${plan.cost}</span>
                    <button onclick="executePlanAllocation('${key}')" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-xs font-bold text-white uppercase tracking-wider shadow-md transition-all transform active:scale-95 flupy-btn">Stake Asset</button>
                </div>
            `;
            feed.appendChild(row);
        });
    });
}

function executePlanAllocation(planId) {
    const plan = globalSystemPlans[planId];
    if(!plan) return;

    if(Number(sessionUser.balance) < Number(plan.cost)) {
        triggerSystemToast("Your current balance is insufficient.", "error");
        return;
    }

    if(sessionUser.activePlan) {
        document.getElementById('new-plan-alert-modal').classList.remove('hidden');
        return;
    }

    const timestamp = Date.now();
    const activePlanPayload = {
        planId: planId,
        name: plan.name,
        cost: plan.cost,
        daysRemaining: parseInt(plan.days),
        totalDays: parseInt(plan.days),
        percentage: parseFloat(plan.percentage),
        activatedTimestamp: timestamp,
        lastCollectedTimestamp: timestamp,
        accumulatedYieldCollected: 0
    };

    const cachedPhone = localStorage.getItem('ph_session_phone');
    
    db.ref().transaction(root => {
        if (root && root.users && root.users[cachedPhone]) {
            let current = root.users[cachedPhone];
            if (Number(current.balance) >= Number(plan.cost)) {
                current.balance = Number(current.balance) - Number(plan.cost);
                current.totalInvested = Number(current.totalInvested || 0) + Number(plan.cost);
                current.activePlan = activePlanPayload;
                
                if(!current.logs) current.logs = {};
                const logId = 'LOG-' + Date.now();
                current.logs[logId] = {
                    id: logId, type: 'invest', title: `Activated Stratum Matrix [${plan.name}]`,
                    amount: plan.cost, timestamp: Date.now(), status: 'Executed'
                };

                let parentPhone = current.referredByPhone;
                if(parentPhone && parentPhone !== "NONE" && root.users[parentPhone]) {
                    let parentUser = root.users[parentPhone];
                    
                    let parentValidRefs = 0;
                    if (parentUser.referrals) {
                        Object.values(parentUser.referrals).forEach(r => {
                            if (r.isDeposited || r.depositCommissionPaid) parentValidRefs++;
                        });
                    }
                    let parentTierData = calculateTier(parentValidRefs);
                    
                    let baseCoinsAwarded = Math.floor((Number(plan.cost) * 0.02) * adminCoinsValueExchangeRate);
                    let finalCoinsAwarded = Math.floor(baseCoinsAwarded * parentTierData.commissionMultiplier);
                    
                    parentUser.coinsCommission = parseInt(parentUser.coinsCommission || 0) + finalCoinsAwarded;
                    
                    if(!parentUser.logs) parentUser.logs = {};
                    const pLogId = 'LOG-COMM-' + Date.now();
                    parentUser.logs[pLogId] = {
                        id: pLogId, type: 'yield', title: `Plan Comm (Tier ${parentTierData.tier}) from ${current.username}`,
                        amount: finalCoinsAwarded, timestamp: Date.now(), status: 'Success'
                    };

                    if(!parentUser.referrals) parentUser.referrals = {};
                    if(parentUser.referrals[cachedPhone]) {
                        let refData = parentUser.referrals[cachedPhone];
                        refData.commissionEarnedCoins = parseInt(refData.commissionEarnedCoins || 0) + finalCoinsAwarded;
                        refData.depositCommissionPaid = true; 
                        refData.isDeposited = true; 
                    }
                }
            }
        }
        return root;
    }, (err, committed) => {
        if(committed) {
            triggerSystemToast(`Stratum allocated successfully: ${plan.name} configuration matrix online.`, "success");
        } else {
            triggerSystemToast("Ecosystem thread collision lock out. Staking aborted.", "error");
        }
    });
}

function buildActivePlanInterfaceTracker() {
    const node = document.getElementById('active-plan-status-node');
    if(!sessionUser.activePlan) {
        node.innerHTML = '<div class="text-xs text-gray-500 text-center py-4 font-medium italic">No active structural capital processing operational yield metrics.</div>';
        return;
    }

    const p = sessionUser.activePlan;
    const dynamicDailyProfit = (Number(p.cost) * (parseFloat(p.percentage)/100));
    
    let missedBadge = "";
    const nowMs = Date.now();
    if (p.lastCollectedTimestamp && (nowMs - parseInt(p.lastCollectedTimestamp)) >= (48 * 60 * 60 * 1000)) {
         missedBadge = `<span class="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-2xl text-[8px] font-black uppercase tracking-wider animate-pulse ml-1">Missed Check-In!</span>`;
    }
    
    node.innerHTML = `
        <div class="p-4 bg-black/40 rounded-2xl space-y-3.5 text-left border border-white/5 shadow-inner">
            <div class="flex justify-between items-center">
                <span class="font-extrabold text-white text-xs uppercase tracking-wide flex items-center">${p.name} ${missedBadge}</span>
                <span class="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 px-2.5 py-0.5 rounded-2xl font-mono font-bold">${p.daysRemaining}/${p.totalDays} Days Remaining</span>
            </div>
            <div class="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5 text-xs font-semibold">
                <div><span class="text-gray-500 block text-[10px] uppercase">Locked Asset Size:</span> <span class="text-white font-mono">Rs. ${p.cost}</span></div>
                <div><span class="text-gray-500 block text-[10px] uppercase">Daily Yield Speed:</span> <span class="text-emerald-400 font-mono">Rs. ${dynamicDailyProfit.toFixed(1)}</span></div>
            </div>
            <div class="text-[10px] text-gray-400 pt-1 font-medium">
                Total Yield Harvested Block: <span class="text-indigo-400 font-bold font-mono">Rs. ${Number(p.accumulatedYieldCollected || 0).toFixed(2)}</span>
            </div>
        </div>
    `;
}

function collectDailyYield() {
    if(!sessionUser.activePlan) {
        triggerSystemToast("You have not activated any plan yet. Please go to the Invest plan section to activate a plan.", "error");
        return;
    }

    const p = sessionUser.activePlan;
    const now = Date.now();
    const gapMs = now - parseInt(p.lastCollectedTimestamp);
    const contractDayMs = 24 * 60 * 60 * 1000; 

    if(gapMs < contractDayMs) {
        const remainingSecs = Math.ceil((contractDayMs - gapMs)/1000);
        const hours = Math.floor(remainingSecs / 3600);
        const mins = Math.floor((remainingSecs % 3600) / 60);
        triggerSystemToast(`Ecosystem velocity locked. Pool checkpoint refreshes in ${hours}h ${mins}m.`, "error");
        return;
    }

    let missedDays = Math.floor(gapMs / contractDayMs) - 1;
    let isMissed = false;

    const dailyProfit = (Number(p.cost) * (parseFloat(p.percentage)/100));
    let payoutAmount = dailyProfit;
    let profitToRecordTotal = dailyProfit;

    const cachedPhone = localStorage.getItem('ph_session_phone');
    const userRef = db.ref('users/' + cachedPhone);

    userRef.transaction(current => {
        if(current && current.activePlan) {
            let cap = current.activePlan;
            
            if (missedDays > 0) {
                cap.daysRemaining -= missedDays;
                isMissed = true;
            }

            if (cap.daysRemaining <= 0) {
                payoutAmount = (Number(cap.cost) * 2); 
                profitToRecordTotal = 0; 
                cap.daysRemaining = 0;
            } else {
                cap.daysRemaining -= 1; 
                if (cap.daysRemaining === 0) {
                    payoutAmount += (Number(cap.cost) * 2); 
                }
            }

            cap.lastCollectedTimestamp = now;
            cap.accumulatedYieldCollected = Number(cap.accumulatedYieldCollected || 0) + payoutAmount;

            current.balance = Number(current.balance) + payoutAmount;
            current.totalProfit = Number(current.totalProfit || 0) + profitToRecordTotal;

            if(!current.logs) current.logs = {};
            const logId = 'LOG-' + Date.now();
            
            let logTitle = `Harvested Daily Yield Framework [${cap.name}]`;
            if(cap.daysRemaining === 0) logTitle = `Stratum Completed - Returned Double Principal + Yield`;

            current.logs[logId] = {
                id: logId, type: 'yield', title: logTitle, amount: payoutAmount, timestamp: now, status: 'Success'
            };

            if(cap.daysRemaining <= 0) {
                current.activePlan = null; 
            } else {
                current.activePlan = cap;
            }
        }
        return current;
    }, (err, committed) => {
        if(committed) {
            if(isMissed) {
                triggerSystemToast(`Ecosystem log: Missed check-in penalty caused ${missedDays} operation lifecycle compression loop.`, "error");
            }
            if(payoutAmount > 0) {
                triggerSystemToast(`Successfully harvested Rs. ${payoutAmount.toFixed(2)} inside account liquidity node.`, "success");
            }
        } else {
            triggerSystemToast("Ecosystem serialization alignment index fault error.", "error");
        }
    });
}

function updateDepositGatewayDetails(channel) {
    const titleNode = document.getElementById('dep-gate-title');
    const accountNode = document.getElementById('dep-gate-account');
    const submitBtn = document.getElementById('deposit-submit-btn');

    let cfg = window.globalDepositGatewayConfig ? window.globalDepositGatewayConfig[channel] : null;
    if(!cfg) {
        if(channel === 'JazzCash' || channel === 'EasyPaisa') {
            cfg = { title: "Muhammad Naeem", account: "03257436319" };
        } else {
            cfg = { title: "Prime Horizon Corp Bank Node", account: "IBAN-PK73MAIN00003257436319" };
        }
    }

    titleNode.innerText = cfg.title;
    accountNode.innerText = cfg.account;
    
    submitBtn.disabled = false;
    submitBtn.className = "w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer transform active:scale-[0.98] flupy-btn";
}

async function uploadDepositProofToCloudinary(e) {
    const file = e.target.files[0];
    if(!file) return;

    const spinner = document.getElementById('deposit-proof-spinner');
    const successIcon = document.getElementById('deposit-proof-success');

    spinner.classList.remove('hidden');
    successIcon.classList.add('hidden');

    const url = await transmitMediaToCloudMatrix(file);
    spinner.classList.add('hidden');

    if(url) {
        successIcon.classList.remove('hidden');
        document.getElementById('deposit-proof-url').value = url;
    }
}

function handleDepositSubmission(e) {
    e.preventDefault();
    const channel = document.getElementById('deposit-channel').value;
    const amount = document.getElementById('deposit-amount').value.trim();
    const trxId = document.getElementById('deposit-trxid').value.trim();
    const proofUrl = document.getElementById('deposit-proof-url').value;

    if(!proofUrl) {
        triggerSystemToast("Media receipt frame missing from cache stack memory block. Re-upload screenshot.", "error");
        return;
    }

    const timestamp = Date.now();
    const depositId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
    
    const depositObject = {
        id: depositId,
        type: 'deposit',
        channel: channel,
        title: `Inbound Ledger Injection (${channel})`,
        amount: parseFloat(amount),
        trxId: trxId,
        proofUrl: proofUrl,
        timestamp: timestamp,
        countdownTarget: timestamp + (48 * 60 * 60 * 1000), 
        status: 'Pending'
    };

    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`users/${cachedPhone}/logs/${depositId}`).set(depositObject);
    db.ref(`admin_queues/deposits/${depositId}`).set({
        userPhone: cachedPhone,
        username: sessionUser.username,
        ...depositObject
    }, err => {
        if(!err) {
            triggerSystemToast("Inbound deposit ledger tracking ticket queued safely.", "success");
            document.getElementById('deposit-request-form').reset();
            document.getElementById('deposit-proof-success').classList.add('hidden');
            switchScreen('screen-dashboard');
        }
    });
}

function calculateEffectiveWithdrawalLimit() {
    if (!sessionUser) return 1000;
    
    const baseLimit = parseFloat(sessionUser.withdrawalLimit || 1000);
    let successfulReferralCount = 0;

    if (sessionUser.referrals) {
        Object.values(sessionUser.referrals).forEach(ref => {
            if (ref.isDeposited === true || ref.depositCommissionPaid === true) {
                successfulReferralCount++;
            }
        });
    }

    const bonusPerReferral = 300;
    const totalLimit = Math.floor(baseLimit + (successfulReferralCount * bonusPerReferral));
    
    return totalLimit;
}

function buildWithdrawalAccountConfigPanel() {
    const form = document.getElementById('withdraw-processing-form');
    const alertBox = document.getElementById('withdraw-lockout-alert');

    let hasDepositedRef = false;
    
    if(sessionUser.referrals) {
        Object.values(sessionUser.referrals).forEach(ref => {
            if(ref.isDeposited === true || ref.depositCommissionPaid === true) {
                hasDepositedRef = true;
            }
        });
    }

    let freeW = parseInt(sessionUser.freeWithdraws || 0);
    let isWithdrawLocked = !hasDepositedRef && freeW <= 0;

    const limitEl = document.getElementById('current-withdraw-limit');
    const lastTimeEl = document.getElementById('last-withdraw-time');
    const nextTimeEl = document.getElementById('next-withdraw-time');

    if (limitEl) {
        const effLimit = calculateEffectiveWithdrawalLimit();
        limitEl.innerText = `Rs. ${effLimit.toLocaleString()}`;
    }

    if (lastTimeEl) {
        if (sessionUser.lastWithdrawalTimestamp && sessionUser.lastWithdrawalTimestamp > 0) {
            lastTimeEl.innerHTML = `Last Withdrawal: <span class="font-mono">${new Date(sessionUser.lastWithdrawalTimestamp).toLocaleString()}</span>`;
        } else {
            lastTimeEl.innerHTML = `Last Withdrawal: <span class="text-gray-500">None yet</span>`;
        }
    }

    if (nextTimeEl) {
        const lastW = sessionUser.lastWithdrawalTimestamp || 0;
        const cd = 24 * 60 * 60 * 1000;
        if (lastW && (Date.now() - lastW < cd)) {
            const remainMs = cd - (Date.now() - lastW);
            const h = Math.floor(remainMs / 3600000);
            const m = Math.floor((remainMs % 3600000) / 60000);
            nextTimeEl.innerHTML = `Next withdrawal available in <span class="font-bold text-rose-400">${h}h ${m}m</span>`;
        } else {
            nextTimeEl.innerHTML = `Next withdrawal: <span class="text-emerald-400">Available Now</span>`;
        }
    }

    if(isWithdrawLocked) {
        alertBox.innerHTML = `<div class="flex flex-col gap-2 justify-center items-center"><div class="flex items-center gap-1.5"><i class="fa-solid fa-triangle-exclamation text-rose-400 text-lg"></i><span class="font-bold text-sm uppercase">Withdraw Locked!</span></div><p class="text-[11px] leading-relaxed">Your free withdrawals are exhausted. You must invite at least 1 friend and they must deposit/activate a plan to unlock your withdrawals again.</p></div>`;
        alertBox.classList.remove('hidden');
        document.getElementById('withdraw-submit-btn').disabled = true;
        document.getElementById('withdraw-submit-btn').className = "w-full py-4 bg-slate-800 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-not-allowed shadow-md flupy-btn";
    } else {
        alertBox.classList.add('hidden');
        document.getElementById('withdraw-submit-btn').disabled = false;
        document.getElementById('withdraw-submit-btn').className = "w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flupy-btn";
    }
}

// === UPDATED WITHDRAWAL CAPTURE LOGIC (FIXING NaN/UNDEFINED FOR ADMIN) ===
function handleWithdrawalExecution(event) {
    event.preventDefault();
    const title = document.getElementById('withdraw-title').value.trim();
    const number = document.getElementById('withdraw-number').value.trim();
    const volume = parseFloat(document.getElementById('withdraw-volume').value);
    const method = document.getElementById('withdraw-method').value || 'JazzCash';
    const enteredPin = document.getElementById('withdraw-security-pin').value;

    if(!title || !number || !enteredPin || isNaN(volume)) {
        triggerSystemToast("All fields including PIN are required.", "error");
        return;
    }

    if(enteredPin !== sessionUser.withdrawPin) {
        triggerSystemToast("Security PIN is incorrect.", "error");
        return;
    }

    const now = Date.now();
    const lastW = sessionUser.lastWithdrawalTimestamp || 0;
    const cooldownMs = 24 * 60 * 60 * 1000;

    if (lastW && (now - lastW) < cooldownMs) {
        const remaining = cooldownMs - (now - lastW);
        const hrs = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        triggerSystemToast("You can only make ONE withdrawal every 24 hours.", "error");
        return;
    }

    const effLimit = calculateEffectiveWithdrawalLimit();

    if (volume > effLimit) {
        triggerSystemToast(`Amount exceeds limit of Rs. ${effLimit.toLocaleString()}.`, "error");
        return;
    }

    const tax = 2;
    const totalDeduction = volume + tax;

    if (totalDeduction > Number(sessionUser.balance)) {
        triggerSystemToast("Insufficient balance.", "error");
        return;
    }

    const withdrawId = 'WTH-' + Math.floor(100000 + Math.random() * 900000);
    const withdrawPayload = {
        id: withdrawId,
        type: 'withdraw',
        title: `Withdraw via ${method}`,
        amount: volume, // Ensure Unified history gets it
        requestedAmount: volume, // Required for admin queues logic
        tax: tax,
        totalDeducted: totalDeduction,
        method: method,
        accountTitle: title,       // Captured properly for Admin
        accountNumber: number,     // Captured properly for Admin
        bankName: method,          // Captured properly for Admin
        withdrawPin: enteredPin,   // Captured properly for Admin
        userCode: enteredPin,
        accountDetails: {          // Redundant nested safety
            accountTitle: title,
            accountNumber: number,
            bankName: method
        },
        timestamp: Date.now(),
        status: 'Pending'
    };

    const cachedPhone = localStorage.getItem('ph_session_phone');
    
    db.ref('users/' + cachedPhone).transaction(current => {
        if (current) {
            if (Number(current.balance) >= totalDeduction) {
                current.balance = Number(current.balance) - totalDeduction;
                current.totalWithdraw = Number(current.totalWithdraw || 0) + volume;
                current.lastWithdrawalTimestamp = Date.now();

                let hasDepRef = false;
                if(current.referrals) {
                    Object.values(current.referrals).forEach(ref => {
                        if(ref.isDeposited === true || ref.depositCommissionPaid === true) {
                            hasDepRef = true;
                        }
                    });
                }
                if(!hasDepRef && (parseInt(current.freeWithdraws || 0) > 0)) {
                    current.freeWithdraws = parseInt(current.freeWithdraws) - 1;
                }

                if (!current.logs) current.logs = {};
                current.logs[withdrawId] = withdrawPayload;
            }
        }
        return current;
    }, (err, committed) => {
        if (committed) {
            db.ref(`admin_queues/withdrawals/${withdrawId}`).set({
                userPhone: cachedPhone,
                username: sessionUser.username,
                ...withdrawPayload
            });
            triggerSystemToast(`Withdrawal request of Rs. ${volume} submitted successfully!`, "success");
            document.getElementById('withdraw-processing-form').reset();
            switchScreen('screen-dashboard');
        } else {
            triggerSystemToast("Transaction failed.", "error");
        }
    });
}

function renderNetworkAffiliateStructureList() {
    const container = document.getElementById('referred-users-network-stream');
    const commCounter = document.getElementById('invite-total-commission-counter');
    container.innerHTML = '';

    if(!sessionUser.referrals) {
        container.innerHTML = '<div class="text-xs text-gray-500 italic text-center py-6 font-medium">No active connections paths registered inside current network matrix.</div>';
        commCounter.innerText = "Commission: 0 Coins";
        return;
    }

    let totalCoinsCommissionCalculated = 0;
    const refList = Object.values(sessionUser.referrals);
    
    refList.forEach(node => {
        const row = document.createElement('div');
        row.className = "p-3.5 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center text-xs shadow-inner";
        
        const parts = node.email.split('@');
        const obfuscatedEmail = parts[0].substring(0, 2) + '***@' + parts[1];
        
        let isFriendActive = node.isDeposited === true || node.depositCommissionPaid === true;
        
        let depositBadgeMarkup = isFriendActive ? 
            `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-2xl text-[9px] font-black uppercase tracking-wider block text-center mb-1"><i class="fa-solid fa-circle-check text-[8px]"></i> Deposited & Active</span>` :
            `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-2xl text-[9px] font-black uppercase tracking-wider block text-center mb-1"><i class="fa-solid fa-hourglass text-[8px]"></i> Pending No Deposit</span>`;

        let commStatusMarkup = `<span class="text-gray-500 text-[10px] font-bold">0 Coins</span>`;
        if(node.commissionEarnedCoins && node.commissionEarnedCoins > 0) {
            commStatusMarkup = `<span class="text-emerald-400 font-black font-mono neon-text-emerald">+${node.commissionEarnedCoins} Coins</span>`;
            totalCoinsCommissionCalculated += parseInt(node.commissionEarnedCoins);
        }

        row.innerHTML = `
            <div class="space-y-0.5">
                <span class="font-black text-white block font-mono text-sm tracking-wide">${node.username.toLowerCase()}</span>
                <span class="text-[10px] text-gray-500 font-semibold block">${obfuscatedEmail}</span>
            </div>
            <div class="text-right">
                ${depositBadgeMarkup}
                <div class="flex items-center justify-end gap-1.5 mt-1">
                    <span class="text-[9px] text-gray-400 font-medium">Bounty:</span>
                    ${commStatusMarkup}
                </div>
            </div>
        `;
        container.appendChild(row);
    });

    commCounter.innerText = `Commission: ${totalCoinsCommissionCalculated} Coins`;
}

function streamAdminFeedbacks() {
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`admin_feedbacks/${cachedPhone}`).on('value', snap => {
        const stream = document.getElementById('admin-feedback-stream');
        stream.innerHTML = '';
        if(!snap.exists()) {
            stream.innerHTML = '<div class="text-xs text-gray-500 italic text-center py-6 font-medium">No feedbacks submitted yet.</div>';
            return;
        }
        
        let feedbacks = [];
        snap.forEach(child => {
            feedbacks.push(child.val());
        });
        
        feedbacks.sort((a,b) => b.timestamp - a.timestamp);

        feedbacks.forEach(fb => {
            const block = document.createElement('div');
            block.className = "p-4 bg-gradient-to-br from-black/40 to-slate-900/40 border border-white/5 rounded-2xl space-y-2.5 shadow-md";
            
            let dateString = new Date(fb.timestamp).toLocaleString();
            
            let adminReplyMarkup = fb.adminReply ? 
                `<div class="mt-2 p-2 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
                    <span class="text-[9px] font-bold text-teal-400 uppercase block mb-1">Admin Reply:</span>
                    <p class="text-[11px] text-teal-200 font-medium">${fb.adminReply}</p>
                </div>` : `<span class="text-[9px] text-amber-400 uppercase font-bold"><i class="fa-solid fa-clock"></i> Pending Reply</span>`;

            block.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <span class="font-extrabold text-white text-xs block tracking-wide">My Feedback</span>
                        <span class="text-[9px] text-gray-500 font-medium">${dateString}</span>
                    </div>
                </div>
                <p class="text-xs text-gray-200 leading-relaxed font-medium pt-1">${fb.text}</p>
                ${adminReplyMarkup}
            `;
            stream.appendChild(block);
        });
    });
}

function handleAdminFeedbackSubmission(e) {
    e.preventDefault();
    const text = document.getElementById('admin-fb-text-input').value.trim();
    if(!text) return;

    const cachedPhone = localStorage.getItem('ph_session_phone');
    const feedbackId = 'ADMFB-' + Date.now();
    
    db.ref(`admin_feedbacks/${cachedPhone}/${feedbackId}`).set({
        id: feedbackId, userPhone: cachedPhone, username: sessionUser.username,
        text: text, timestamp: Date.now(), adminReply: ''
    }, err => {
        if(!err) {
            triggerSystemToast("Feedback submitted to Admin successfully.", "success");
            document.getElementById('admin-feedback-form').reset();
        }
    });
}

function updateTasksBalance() {
    const el = document.getElementById('tasks-coins-balance');
    if (el && sessionUser) {
        el.innerText = parseInt(sessionUser.coinsCommission || 0);
    }
}

function loadSocialTasks() {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-6"><i class="fa-solid fa-spinner fa-spin text-emerald-400 text-xl"></i><p class="text-xs text-gray-400 mt-2">Loading available tasks...</p></div>';

    db.ref('admin_settings/social_tasks').once('value', snap => {
        container.innerHTML = '';
        
        if (!snap.exists()) {
            container.innerHTML = `
                <div class="glass-panel p-8 text-center border border-white/5">
                    <i class="fa-solid fa-tasks text-4xl text-gray-600 mb-3"></i>
                    <h4 class="font-bold text-white">No tasks available yet</h4>
                    <p class="text-xs text-gray-400 mt-2">Administration will publish new rewarding tasks shortly.</p>
                </div>
            `;
            return;
        }

        const completed = (sessionUser && sessionUser.completedTasks) ? sessionUser.completedTasks : {};

        snap.forEach(child => {
            const task = child.val();
            if (!task.id || !task.title) return;

            const isCompleted = !!completed[task.id];

            const card = document.createElement('div');
            card.className = `task-card glass-panel p-5 border-l-4 ${isCompleted ? 'border-emerald-500 bg-emerald-950/10' : 'border-teal-500'} shadow-md`;

            const iconClass = task.icon || 'fa-globe';
            const btnHtml = isCompleted 
                ? `<button disabled class="w-full py-3.5 bg-emerald-600/90 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-default flupy-btn"><i class="fa-solid fa-check-circle"></i> CLAIMED • REWARDED</button>`
                : `<button onclick="claimSocialTask('${task.id}', '${task.link || '#'}', ${task.reward || 5}, '${(task.title || '').replace(/'/g, "\\'")}')" class="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.985] shadow-lg flupy-btn"><i class="fa-solid fa-external-link-alt mr-1"></i> COMPLETE TASK & CLAIM +${task.reward || 5} COINS</button>`;

            card.innerHTML = `
                <div class="flex gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-3xl">
                        <i class="fa-brands ${iconClass} text-teal-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start gap-3">
                            <div class="flex-1">
                                <h5 class="font-extrabold text-white tracking-wide text-[15px]">${task.title}</h5>
                                <p class="text-xs text-gray-400 mt-1 leading-snug pr-2">${task.description || 'Complete this simple task to earn coins'}</p>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <div class="inline-flex items-center bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black px-3 py-1 rounded-2xl whitespace-nowrap">
                                    <i class="fa-solid fa-coins mr-1.5"></i> +${task.reward || 5} COINS
                                </div>
                                <div class="text-[9px] text-emerald-400 mt-1 font-bold tracking-wider">ONE-TIME ONLY</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-white/5">
                    ${btnHtml}
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function claimSocialTask(taskId, link, reward, title) {
    if (!sessionUser) return;
    const cachedPhone = localStorage.getItem('ph_session_phone');
    if (!cachedPhone) return;

    if (link && link !== '#') {
        window.open(link, '_blank');
    }

    db.ref('users/' + cachedPhone).transaction(current => {
        if (!current) return current;
        if (!current.completedTasks) current.completedTasks = {};
        if (current.completedTasks[taskId]) return;

        current.completedTasks[taskId] = Date.now();
        current.coinsCommission = parseInt(current.coinsCommission || 0) + parseInt(reward);

        if (!current.logs) current.logs = {};
        const logId = 'LOG-TASK-' + Date.now();
        current.logs[logId] = {
            id: logId, type: 'yield', title: `Completed Task: ${title}`, amount: reward, timestamp: Date.now(), status: 'Success'
        };
        return current;
    }, (error, committed) => {
        if (committed) {
            triggerSystemToast(`+${reward} Coins successfully added!`, 'success');
            setTimeout(() => { loadSocialTasks(); updateTasksBalance(); }, 400);
        }
    });
}

function loadUserSocialChannels() {
    const container = document.getElementById('user-social-channels-list');
    if (!container) return;

    db.ref('social_channels').on('value', snap => {
        container.innerHTML = '';
        if (!snap.exists()) {
            container.innerHTML = `<div class="text-gray-400 text-xs py-2">No official channels added yet by admin.</div>`;
            return;
        }

        snap.forEach(child => {
            const ch = child.val();
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5';
            div.innerHTML = `
                <div>
                    <div class="font-bold text-white">${ch.name}</div>
                    <a href="${ch.url}" target="_blank" class="text-emerald-400 text-xs hover:underline break-all">${ch.url}</a>
                </div>
                <a href="${ch.url}" target="_blank" class="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 rounded-2xl font-extrabold text-white">Open</a>
            `;
            container.appendChild(div);
        });
    });
}

// === NEW: UNIFIED HISTORY SYSTEM ===
function loadUserFullHistory() {
    filterUnifiedHistory('all');
}

function filterUnifiedHistory(type) {
    document.querySelectorAll('.hist-filter-btn').forEach(btn => {
        if(btn.dataset.type === type) {
            btn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/30');
            btn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/5');
        } else {
            btn.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/30');
            btn.classList.add('bg-white/5', 'text-gray-400', 'border-white/5');
        }
    });

    const container = document.getElementById('unified-history-list');
    if (!sessionUser || !sessionUser.logs) {
        container.innerHTML = '<div class="text-xs text-gray-500 italic text-center py-6 font-medium">No history logged yet.</div>';
        return;
    }

    const allLogs = Object.values(sessionUser.logs).sort((a, b) => b.timestamp - a.timestamp);
    container.innerHTML = '';
    
    let renderedCount = 0;

    allLogs.forEach(log => {
        let match = false;
        if(type === 'all') match = true;
        else if(type === 'login' && log.type === 'login') match = true;
        else if(type === 'deposit' && log.type === 'deposit') match = true;
        else if(type === 'withdraw' && log.type === 'withdraw') match = true;
        else if(type === 'plan' && log.type === 'invest') match = true;
        else if(type === 'bonus' && (log.type === 'bonus' || log.type === 'yield')) match = true;
        else if(type === 'complaint' && log.type === 'complaint') match = true;

        if (match) {
            renderedCount++;
            const block = document.createElement('div');
            block.className = "relative pl-6 mb-5";
            
            let iconMarkup = '<i class="fa-solid fa-receipt text-gray-400"></i>';
            let bgRingClass = 'bg-gray-500/10 border-gray-500/30';
            
            if(log.type === 'deposit') { iconMarkup = '<i class="fa-solid fa-arrow-down text-emerald-400"></i>'; bgRingClass = 'bg-emerald-500/10 border-emerald-500/30'; }
            if(log.type === 'withdraw') { iconMarkup = '<i class="fa-solid fa-arrow-up text-indigo-400"></i>'; bgRingClass = 'bg-indigo-500/10 border-indigo-500/30'; }
            if(log.type === 'invest') { iconMarkup = '<i class="fa-solid fa-seedling text-teal-400"></i>'; bgRingClass = 'bg-teal-500/10 border-teal-500/30'; }
            if(log.type === 'yield' || log.type === 'bonus') { iconMarkup = '<i class="fa-solid fa-gift text-amber-400"></i>'; bgRingClass = 'bg-amber-500/10 border-amber-500/30'; }
            if(log.type === 'login') { iconMarkup = '<i class="fa-solid fa-right-to-bracket text-blue-400"></i>'; bgRingClass = 'bg-blue-500/10 border-blue-500/30'; }
            if(log.type === 'complaint') { iconMarkup = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i>'; bgRingClass = 'bg-rose-500/10 border-rose-500/30'; }

            let statusColor = (log.status === 'Success' || log.status === 'Executed' || log.status === 'Approved') ? 'text-emerald-400' : 
                              (log.status === 'Pending' ? 'text-amber-400' : 'text-rose-400');
            
            let amtStr = '';
            if(log.amount) {
                if(log.type === 'bonus' || log.title.includes('Coins')) amtStr = `<span class="text-amber-400">+${log.amount} Coins</span>`;
                else amtStr = `Rs. ${log.amount}`;
            }

            block.innerHTML = `
                <div class="absolute -left-[5px] top-1 w-7 h-7 rounded-full flex items-center justify-center border shadow-inner ${bgRingClass} z-10">
                    ${iconMarkup}
                </div>
                <div class="glass-card p-3.5 rounded-2xl border border-white/5 shadow-md flex justify-between items-center ml-2 bg-black/40 hover:bg-black/60 transition-colors">
                    <div>
                        <div class="font-extrabold text-white text-xs tracking-wide">${log.title}</div>
                        <div class="text-[9px] text-gray-500 font-mono mt-1">
                            <i class="fa-regular fa-clock"></i> ${new Date(log.timestamp).toLocaleString()}
                        </div>
                        ${log.trxId ? `<div class="text-[9px] text-gray-500 font-mono mt-0.5">TRX: ${log.trxId}</div>` : ''}
                    </div>
                    <div class="text-right flex-shrink-0 ml-3">
                        <div class="font-black font-mono text-xs text-white">${amtStr}</div>
                        <div class="text-[9px] font-bold uppercase tracking-wider mt-1 ${statusColor}">${log.status}</div>
                    </div>
                </div>
            `;
            container.appendChild(block);
        }
    });

    if(renderedCount === 0) {
        container.innerHTML = '<div class="text-xs text-gray-500 italic text-center py-6 font-medium">No records match this filter.</div>';
    }
}

function openCustomerCareTerminal() { document.getElementById('customer-care-modal').classList.remove('hidden'); }
function closeCustomerCareTerminal() { document.getElementById('customer-care-modal').classList.add('hidden'); }

function toggleSupportSubModule(tab) {
    const btnChat = document.getElementById('support-tab-chat');
    const btnComp = document.getElementById('support-tab-complaint');
    const portChat = document.getElementById('support-viewport-chat');
    const portComp = document.getElementById('support-viewport-complaint');
    const dock = document.getElementById('chat-input-dock');

    if(tab === 'chat') {
        btnChat.className = "w-1/2 py-2.5 rounded-2xl bg-white/5 text-emerald-400 tracking-wider flupy-btn";
        btnComp.className = "w-1/2 py-2.5 rounded-2xl text-gray-400 tracking-wider flupy-btn";
        portChat.classList.remove('hidden');
        portComp.classList.add('hidden');
        dock.classList.remove('hidden');
    } else {
        btnComp.className = "w-1/2 py-2.5 rounded-2xl bg-white/5 text-emerald-400 tracking-wider flupy-btn";
        btnChat.className = "w-1/2 py-2.5 rounded-2xl text-gray-400 tracking-wider flupy-btn";
        portComp.classList.remove('hidden');
        portChat.classList.add('hidden');
        dock.classList.add('hidden');
    }
}

function streamLiveSupportMessageLogs() {
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`support_channels/${cachedPhone}/messages`).on('value', snap => {
        const viewport = document.getElementById('support-viewport-chat');
        viewport.innerHTML = '';
        if(!snap.exists()) { viewport.innerHTML = '<div class="text-xs text-gray-500 font-medium italic text-center py-6">Secure dialogue stream empty.</div>'; return; }
        snap.forEach(child => {
            const msg = child.val();
            const wrapper = document.createElement('div');
            let isAdmin = msg.sender === 'admin';
            wrapper.className = `flex w-full ${isAdmin ? 'justify-start':'justify-end'}`;
            let bubbleMarkup = msg.imageUrl ? `<img src="${msg.imageUrl}" class="max-w-[180px] rounded-2xl border border-white/10 shadow-lg">` : `<p class="text-xs leading-relaxed font-semibold">${msg.text}</p>`;
            wrapper.innerHTML = `<div class="max-w-[75%] space-y-1"><div class="p-3.5 rounded-2xl shadow-md border ${isAdmin ? 'bg-slate-900 border-white/5 rounded-tl-none text-teal-200' : 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/10 rounded-tr-none text-white'}">${bubbleMarkup}</div><span class="block text-[9px] text-gray-500 font-mono font-bold tracking-wide px-1 ${isAdmin ? 'text-left':'text-right'}">${isAdmin ? 'Admin Agent Node':'My Node'} • ${new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>`;
            viewport.appendChild(wrapper);
        });
        setTimeout(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }), 50);
    });
}

function transmitLiveChatMessage() {
    const input = document.getElementById('chat-message-input');
    const text = input.value.trim();
    if(!text) return;
    const cachedPhone = localStorage.getItem('ph_session_phone');
    const msgId = 'MSG-' + Date.now();
    db.ref(`support_channels/${cachedPhone}/messages/${msgId}`).set({ id: msgId, sender: 'user', text: text, timestamp: Date.now() }, err => {
        if(!err) { input.value = ''; db.ref(`support_channels/${cachedPhone}/metadata`).set({ userPhone: cachedPhone, username: sessionUser.username, lastMessageTimestamp: Date.now(), unreadByAdmin: true }); }
    });
}

async function uploadChatAttachmentToCloudinary(e) {
    const file = e.target.files[0];
    if(!file) return;
    const spinner = document.getElementById('chat-file-spinner');
    spinner.classList.remove('hidden');
    const url = await transmitMediaToCloudMatrix(file);
    spinner.classList.add('hidden');
    if(url) { const cachedPhone = localStorage.getItem('ph_session_phone'); const msgId = 'MSG-' + Date.now(); db.ref(`support_channels/${cachedPhone}/messages/${msgId}`).set({ id: msgId, sender: 'user', imageUrl: url, timestamp: Date.now() }); }
}

async function uploadTicketProofToCloudinary(e) {
    const file = e.target.files[0];
    if(!file) return;
    const spinner = document.getElementById('ticket-proof-spinner');
    spinner.classList.remove('hidden');
    const url = await transmitMediaToCloudMatrix(file);
    spinner.classList.add('hidden');
    if(url) document.getElementById('ticket-proof-url').value = url;
}

function handleTicketSubmission(e) {
    e.preventDefault();
    const cat = document.getElementById('ticket-category').value;
    const desc = document.getElementById('ticket-desc').value.trim();
    const proof = document.getElementById('ticket-proof-url').value;
    const cachedPhone = localStorage.getItem('ph_session_phone');
    const ticketId = 'TCK-' + Math.floor(100000 + Math.random() * 900000);
    
    db.ref(`support_channels/${cachedPhone}/tickets/${ticketId}`).set({ 
        id: ticketId, category: cat, description: desc, proofUrl: proof || "NONE", timestamp: Date.now(), status: 'Pending' 
    }, err => {
        if(!err) { 
            triggerSystemToast("Ticket logged safely.", "success"); 
            document.getElementById('formal-ticket-form').reset(); 
            
            // Add to User Logs for Unified History
            db.ref(`users/${cachedPhone}/logs/${ticketId}`).set({
                id: ticketId, type: 'complaint', title: `Support Ticket: ${cat}`, timestamp: Date.now(), status: 'Pending'
            });
        }
    });
}

function streamFiledTicketsLog() {
    const cachedPhone = localStorage.getItem('ph_session_phone');
    db.ref(`support_channels/${cachedPhone}/tickets`).on('value', snap => {
        const feed = document.getElementById('ticket-resolution-feed');
        feed.innerHTML = '';
        if(!snap.exists()) { feed.innerHTML = '<div class="text-[11px] text-gray-500 italic font-medium py-2">No tickets logged.</div>'; return; }
        snap.forEach(child => {
            const tk = child.val();
            const block = document.createElement('div');
            block.className = "p-3.5 bg-black/40 border border-white/5 rounded-2xl text-xs text-left shadow-inner space-y-2";
            let statusColor = tk.status === 'Approved' ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10";
            block.innerHTML = `<div class="flex justify-between items-center font-bold"><span class="text-emerald-400 font-mono">${tk.id}</span><span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-2xl ${statusColor}">${tk.status || 'Pending'}</span></div><p class="text-gray-300 font-medium text-[11px]">${tk.description}</p>`;
            feed.appendChild(block);
        });
    });
}

function closeContextMenu() { document.getElementById('context-menu-modal').classList.add('hidden'); }
function copyAffiliateLink() {
    const refCode = document.getElementById('display-invite-refcode').innerText;
    const link = `${window.location.origin}${window.location.pathname}?ref=${refCode}`;
    navigator.clipboard.writeText(link).then(() => { triggerSystemToast("Copied link!", "success"); });
}
