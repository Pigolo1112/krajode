/* ================================================
   Krajood Craft — Auth Logic (Supabase)
   ================================================ */

// ===== โหลด Supabase แบบ Dynamic (ไม่ crash ถ้าโหลดไม่ได้) =====
let supabase = null;

async function initSupabase() {
    try {
        const config = await import('./supabase-config.js');
        supabase = config.supabase;
        console.log('✅ Supabase connected');
        // เช็ค login หลัง connect สำเร็จ
        checkAuth();
    } catch (e) {
        console.error('❌ Supabase connection failed:', e);
        showMessage('ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบการตั้งค่า Supabase', 'error');
    }
}

// ===== DOM Elements =====
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const tabIndicator = document.getElementById('tabIndicator');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const authMessage = document.getElementById('authMessage');

// ===== Helper Functions =====
function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = 'block';
}

function hideMessage() {
    authMessage.style.display = 'none';
}

function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        text.style.display = 'none';
        loader.style.display = 'inline-block';
        btn.disabled = true;
    } else {
        text.style.display = '';
        loader.style.display = 'none';
        btn.disabled = false;
    }
}

function getThaiError(msg) {
    const m = {
        'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'Email not confirmed': 'อีเมลยังไม่ได้ยืนยัน กรุณาตรวจสอบกล่องข้อความ',
        'User already registered': 'อีเมลนี้ถูกใช้งานแล้ว',
        'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'Unable to validate email address': 'รูปแบบอีเมลไม่ถูกต้อง',
        'For security purposes': 'ลองบ่อยเกินไป กรุณารอสักครู่',
        'Email rate limit exceeded': 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่',
        'Signups not allowed': 'ระบบยังไม่เปิดรับสมัครสมาชิก',
    };
    for (const [k, v] of Object.entries(m)) {
        if (msg.includes(k)) return v;
    }
    return 'เกิดข้อผิดพลาด: ' + msg;
}

// ===== Redirect by Role =====
async function redirectByRole(user) {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile && profile.role === 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'courses.html';
        }
    } catch (e) {
        window.location.href = 'courses.html';
    }
}

// ===== Promote to Admin =====
async function tryPromoteToAdmin(adminCode) {
    if (!adminCode || adminCode.trim() === '') return true;
    try {
        const { data, error } = await supabase.rpc('promote_to_admin', {
            secret_code: adminCode.trim()
        });
        if (error) {
            showMessage('ตรวจสอบรหัส Admin ผิดพลาด: ' + error.message, 'error');
            return false;
        }
        if (data && data.success) return true;
        showMessage(data?.message || 'รหัส Admin ไม่ถูกต้อง', 'error');
        return false;
    } catch (e) {
        showMessage('เกิดข้อผิดพลาด: ' + e.message, 'error');
        return false;
    }
}

// ===== Check Auth =====
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await redirectByRole(session.user);
        }
    } catch (e) {
        console.log('Auth check skipped:', e.message);
    }
}

// ===================================================
// UI EVENT LISTENERS — ทำงานได้ทันทีไม่ต้องรอ Supabase
// ===================================================

// Tab Switching
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = '';
    registerForm.style.display = 'none';
    tabIndicator.classList.remove('right');
    hideMessage();
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = '';
    loginForm.style.display = 'none';
    tabIndicator.classList.add('right');
    hideMessage();
});

// Toggle Password
document.getElementById('toggleLoginPw').addEventListener('click', () => {
    const i = document.getElementById('loginPassword');
    i.type = i.type === 'password' ? 'text' : 'password';
});
document.getElementById('toggleRegPw').addEventListener('click', () => {
    const i = document.getElementById('registerPassword');
    i.type = i.type === 'password' ? 'text' : 'password';
});

// ===== Login =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabase) {
        showMessage('ระบบยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่', 'error');
        return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const adminCode = document.getElementById('loginAdminCode').value;
    const btn = document.getElementById('loginBtn');

    setLoading(btn, true);
    hideMessage();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage(getThaiError(error.message), 'error');
        setLoading(btn, false);
        return;
    }

    if (adminCode) {
        const promoted = await tryPromoteToAdmin(adminCode);
        if (!promoted) { setLoading(btn, false); return; }
    }

    showMessage('เข้าสู่ระบบสำเร็จ! กำลังนำทาง...', 'success');
    await redirectByRole(data.user);
});

// ===== Register =====
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabase) {
        showMessage('ระบบยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่', 'error');
        return;
    }

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const adminCode = document.getElementById('registerAdminCode').value;
    const btn = document.getElementById('registerBtn');

    if (password !== confirm) { showMessage('รหัสผ่านไม่ตรงกัน', 'error'); return; }
    if (password.length < 6) { showMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error'); return; }

    setLoading(btn, true);
    hideMessage();

    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, full_name: name } }
    });

    if (error) { showMessage(getThaiError(error.message), 'error'); setLoading(btn, false); return; }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        showMessage('อีเมลนี้ถูกใช้งานแล้ว', 'error'); setLoading(btn, false); return;
    }

    if (data.session) {
        if (adminCode) {
            await new Promise(r => setTimeout(r, 800));
            const promoted = await tryPromoteToAdmin(adminCode);
            if (!promoted) { setLoading(btn, false); return; }
        }
        showMessage('สมัครสมาชิกสำเร็จ! กำลังนำทาง...', 'success');
        await redirectByRole(data.user);
    } else {
        showMessage('สมัครสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี', 'success');
        setLoading(btn, false);
    }
});

// ===== Google Sign In =====
googleSignInBtn.addEventListener('click', async () => {
    if (!supabase) { showMessage('ระบบยังไม่พร้อม', 'error'); return; }
    hideMessage();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/courses.html' }
    });
    if (error) showMessage(getThaiError(error.message), 'error');
});

// ===== Forgot Password =====
document.querySelector('.forgot-link').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!supabase) { showMessage('ระบบยังไม่พร้อม', 'error'); return; }
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { showMessage('กรุณากรอกอีเมลก่อนกด "ลืมรหัสผ่าน"', 'error'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth.html'
    });
    if (error) { showMessage(getThaiError(error.message), 'error'); }
    else { showMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว', 'success'); }
});

// ===== เริ่มโหลด Supabase =====
initSupabase();
