/* ================================================
   Krajood Craft — Admin Dashboard Logic (Supabase)
   ================================================ */

import { supabase } from './supabase-config.js';

// ===== DOM Elements =====
const loadingScreen = document.getElementById('loadingScreen');
const dashboardLayout = document.getElementById('dashboardLayout');
const pageTitle = document.getElementById('pageTitle');
const adminName = document.getElementById('adminName');
const adminEmail = document.getElementById('adminEmail');
const adminAvatar = document.getElementById('adminAvatar');

// Stats
const totalUsersEl = document.getElementById('totalUsers');
const totalCoursesEl = document.getElementById('totalCourses');
const totalClipsEl = document.getElementById('totalClips');
const newUsersEl = document.getElementById('newUsers');

// Tables
const coursesTableBody = document.getElementById('coursesTableBody');
const usersTableBody = document.getElementById('usersTableBody');
const coursesEmpty = document.getElementById('coursesEmpty');
const usersEmpty = document.getElementById('usersEmpty');
const recentCoursesList = document.getElementById('recentCoursesList');

// Modals
const courseModal = document.getElementById('courseModal');
const deleteModal = document.getElementById('deleteModal');
const courseForm = document.getElementById('courseForm');
const clipsList = document.getElementById('clipsList');

// ===== Auth Guard =====
let currentUser = null;

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'auth.html';
        return;
    }

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        window.location.href = 'courses.html';
        return;
    }

    currentUser = session.user;

    // Update admin info
    adminName.textContent = profile.name || session.user.email;
    adminEmail.textContent = session.user.email;
    adminAvatar.textContent = (profile.name || 'A').charAt(0).toUpperCase();

    // Show dashboard
    loadingScreen.style.display = 'none';
    dashboardLayout.style.display = 'flex';

    // Load data
    loadOverviewData();
    loadCourses();
    loadUsers();
}

checkAuth();

// ===== Sidebar Navigation =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.dashboard-section');
const sectionTitles = {
    'overview': 'ภาพรวม',
    'courses': 'จัดการคอร์ส',
    'users': 'ผู้ใช้งาน',
    'products': 'จัดการสินค้า',
    'orders': 'คำสั่งซื้อ'
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.dataset.section;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${sectionId}`).classList.add('active');

        pageTitle.textContent = sectionTitles[sectionId];

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Mobile sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ===== Logout =====
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// ===== Load Overview Data =====
async function loadOverviewData() {
    try {
        // Users count
        const { data: users, count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' });
        totalUsersEl.textContent = users ? users.length : 0;

        // New users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newCount = users ? users.filter(u => new Date(u.created_at) >= today).length : 0;
        newUsersEl.textContent = newCount;

        // Courses count
        const { data: courses } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        totalCoursesEl.textContent = courses ? courses.length : 0;

        // Total clips count
        const { data: clips } = await supabase
            .from('clips')
            .select('id');
        totalClipsEl.textContent = clips ? clips.length : 0;

        // Recent courses
        renderRecentCourses(courses || []);
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

function renderRecentCourses(courses) {
    if (courses.length === 0) {
        recentCoursesList.innerHTML = `
            <div class="empty-state">
                <span>📚</span>
                <p>ยังไม่มีคอร์สเรียน</p>
                <button class="btn-primary-sm" onclick="document.getElementById('nav-courses').click()">
                    + เพิ่มคอร์สแรก
                </button>
            </div>
        `;
        return;
    }

    const recent = courses.slice(0, 5);
    const levelLabels = { beginner: 'เริ่มต้น', intermediate: 'กลาง', advanced: 'สูง' };

    recentCoursesList.innerHTML = recent.map(course => {
        const date = new Date(course.created_at).toLocaleDateString('th-TH');
        return `
            <div class="recent-course-item">
                <img class="recent-course-cover" src="${course.cover_image || 'images/hero_banner.png'}" alt="${course.title}" onerror="this.src='images/hero_banner.png'">
                <div class="recent-course-info">
                    <div class="recent-course-title">${course.title}</div>
                    <div class="recent-course-meta">${levelLabels[course.level] || course.level} · ${course.clip_count || 0} คลิป · สร้างเมื่อ ${date}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Load Courses =====
let allCourses = [];

async function loadCourses() {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allCourses = data || [];
        renderCoursesTable();
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

function renderCoursesTable() {
    if (allCourses.length === 0) {
        document.getElementById('coursesTable').style.display = 'none';
        coursesEmpty.style.display = 'block';
        return;
    }

    document.getElementById('coursesTable').style.display = '';
    coursesEmpty.style.display = 'none';

    const levelLabels = { beginner: 'เริ่มต้น', intermediate: 'กลาง', advanced: 'สูง' };

    coursesTableBody.innerHTML = allCourses.map(course => {
        const date = new Date(course.created_at).toLocaleDateString('th-TH');
        return `
            <tr>
                <td><img class="table-cover" src="${course.cover_image || 'images/hero_banner.png'}" alt="${course.title}" onerror="this.src='images/hero_banner.png'"></td>
                <td><strong style="color:var(--text-white)">${course.title}</strong></td>
                <td><span class="level-badge ${course.level}">${levelLabels[course.level] || course.level}</span></td>
                <td>${course.clip_count || 0} คลิป</td>
                <td>${date}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon edit" onclick="window.editCourse('${course.id}')" title="แก้ไข">✏️</button>
                        <button class="btn-icon delete" onclick="window.deleteCourse('${course.id}')" title="ลบ">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== Load Users =====
async function loadUsers() {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!users || users.length === 0) {
            document.getElementById('usersTable').style.display = 'none';
            usersEmpty.style.display = 'block';
            return;
        }

        document.getElementById('usersTable').style.display = '';
        usersEmpty.style.display = 'none';

        usersTableBody.innerHTML = users.map(user => {
            const date = new Date(user.created_at).toLocaleDateString('th-TH');
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-cell-avatar">${initial}</div>
                            <span style="color:var(--text-white)">${user.name || 'ไม่ระบุ'}</span>
                        </div>
                    </td>
                    <td>${user.email || '-'}</td>
                    <td><span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'User'}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ===== Course Modal =====
let editingCourseId = null;
let clipCounter = 0;

document.getElementById('addCourseBtn').addEventListener('click', () => {
    editingCourseId = null;
    courseForm.reset();
    clipsList.innerHTML = '';
    clipCounter = 0;
    document.getElementById('modalTitle').textContent = 'เพิ่มคอร์สใหม่';
    document.getElementById('courseId').value = '';
    courseModal.classList.add('active');
});

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelCourseBtn').addEventListener('click', closeModal);

function closeModal() {
    courseModal.classList.remove('active');
}

// Add clip
document.getElementById('addClipBtn').addEventListener('click', () => {
    clipCounter++;
    addClipRow(clipCounter, '', '', '', '', '');
});

function addClipRow(order, title, videoURL, description, duration, imageURL) {
    const clipHtml = `
        <div class="clip-item" data-order="${order}">
            <div class="clip-item-header">
                <span class="clip-step-number">Step ${order}</span>
                <button type="button" class="btn-remove-clip" onclick="this.closest('.clip-item').remove()">✕</button>
            </div>
            <div class="clip-fields">
                <input type="text" class="clip-title" placeholder="ชื่อคลิป เช่น การจับเส้นกระจูด" value="${title}" required>
                <div class="clip-field-row">
                    <input type="url" class="clip-video" placeholder="YouTube URL หรือลิงก์วิดีโอ" value="${videoURL}">
                    <input type="text" class="clip-duration" placeholder="ระยะเวลา เช่น 15:30" value="${duration}">
                </div>
                <input type="url" class="clip-image" placeholder="🖼️ URL รูปภาพประกอบ (ไม่บังคับ)" value="${imageURL || ''}">
                <textarea class="clip-description" rows="2" placeholder="คำอธิบายคลิป...">${description}</textarea>
            </div>
        </div>
    `;
    clipsList.insertAdjacentHTML('beforeend', clipHtml);
}

// Save course
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveCourseBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    btn.disabled = true;

    try {
        const title = document.getElementById('courseTitle').value.trim();
        const description = document.getElementById('courseDescription').value.trim();
        const level = document.getElementById('courseLevel').value;
        const coverImage = document.getElementById('courseCover').value.trim();

        // Collect clips
        const clipItems = clipsList.querySelectorAll('.clip-item');
        const clips = [];
        clipItems.forEach((item, idx) => {
            const clipTitle = item.querySelector('.clip-title').value.trim();
            const clipVideo = item.querySelector('.clip-video').value.trim();
            const clipDuration = item.querySelector('.clip-duration').value.trim();
            const clipDesc = item.querySelector('.clip-description').value.trim();
            const clipImage = item.querySelector('.clip-image') ? item.querySelector('.clip-image').value.trim() : '';

            if (clipTitle) {
                let videoType = 'upload';
                if (clipVideo.includes('youtube.com') || clipVideo.includes('youtu.be')) {
                    videoType = 'youtube';
                }

                clips.push({
                    title: clipTitle,
                    video_url: clipVideo,
                    video_type: videoType,
                    duration: clipDuration,
                    description: clipDesc,
                    image_url: clipImage,
                    sort_order: idx + 1
                });
            }
        });

        const courseData = {
            title,
            description,
            level,
            cover_image: coverImage || '',
            clip_count: clips.length,
            updated_at: new Date().toISOString()
        };

        let courseId;

        if (editingCourseId) {
            // Update existing course
            courseId = editingCourseId;
            const { error } = await supabase
                .from('courses')
                .update(courseData)
                .eq('id', courseId);
            if (error) throw error;

            // Delete old clips
            await supabase.from('clips').delete().eq('course_id', courseId);
        } else {
            // Create new course
            const { data, error } = await supabase
                .from('courses')
                .insert(courseData)
                .select()
                .single();
            if (error) throw error;
            courseId = data.id;
        }

        // Add clips
        if (clips.length > 0) {
            const clipsWithCourseId = clips.map(clip => ({
                ...clip,
                course_id: courseId
            }));
            const { error: clipError } = await supabase
                .from('clips')
                .insert(clipsWithCourseId);
            if (clipError) throw clipError;
        }

        closeModal();
        loadCourses();
        loadOverviewData();

    } catch (error) {
        console.error('Error saving course:', error);
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
        btnText.style.display = '';
        btnLoader.style.display = 'none';
        btn.disabled = false;
    }
});

// Edit course
window.editCourse = async function(courseId) {
    editingCourseId = courseId;
    document.getElementById('modalTitle').textContent = 'แก้ไขคอร์ส';

    try {
        const { data: course, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (error || !course) return;

        document.getElementById('courseTitle').value = course.title || '';
        document.getElementById('courseDescription').value = course.description || '';
        document.getElementById('courseLevel').value = course.level || 'beginner';
        document.getElementById('courseCover').value = course.cover_image || '';

        // Load clips
        clipsList.innerHTML = '';
        clipCounter = 0;
        const { data: clips } = await supabase
            .from('clips')
            .select('*')
            .eq('course_id', courseId)
            .order('sort_order');

        if (clips) {
            clips.forEach(clip => {
                clipCounter++;
                addClipRow(
                    clip.sort_order || clipCounter,
                    clip.title || '',
                    clip.video_url || '',
                    clip.description || '',
                    clip.duration || '',
                    clip.image_url || ''
                );
            });
        }

        courseModal.classList.add('active');
    } catch (error) {
        console.error('Error loading course:', error);
    }
};

// Delete course
let deletingCourseId = null;

window.deleteCourse = function(courseId) {
    deletingCourseId = courseId;
    deleteModal.classList.add('active');
};

document.getElementById('deleteModalClose').addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deletingCourseId) return;

    try {
        // Delete clips first (cascade should handle this, but let's be safe)
        await supabase.from('clips').delete().eq('course_id', deletingCourseId);

        // Delete course
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', deletingCourseId);

        if (error) throw error;

        deleteModal.classList.remove('active');
        loadCourses();
        loadOverviewData();
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
});

// ===== Product Management =====
const productsTableBody = document.getElementById('productsTableBody');
const productsEmpty = document.getElementById('productsEmpty');
const productModal = document.getElementById('productModal');

let allProducts = [];
let editingProductId = null;

async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('sort_order');

        if (error) throw error;
        allProducts = data || [];
        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductsTable() {
    const table = document.getElementById('productsTable');
    if (!allProducts.length) {
        if (table) table.style.display = 'none';
        if (productsEmpty) productsEmpty.style.display = 'block';
        return;
    }
    if (table) table.style.display = '';
    if (productsEmpty) productsEmpty.style.display = 'none';

    if (productsTableBody) {
        productsTableBody.innerHTML = allProducts.map(p => `
            <tr>
                <td><img class="table-cover" src="${p.image_url || 'images/shop_kit.png'}" alt="${p.title}" onerror="this.src='images/shop_kit.png'"></td>
                <td><strong style="color:var(--text-white)">${p.title}</strong></td>
                <td>฿${Number(p.price).toLocaleString()}</td>
                <td>${p.badge || '-'}</td>
                <td><span class="role-badge ${p.is_active ? 'admin' : 'user'}">${p.is_active ? 'เปิด' : 'ปิด'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon edit" onclick="window.editProduct('${p.id}')" title="แก้ไข">✏️</button>
                        <button class="btn-icon delete" onclick="window.deleteProduct('${p.id}')" title="ลบ">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Add product button
const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        editingProductId = null;
        document.getElementById('productForm').reset();
        document.getElementById('productModalTitle').textContent = 'เพิ่มสินค้าใหม่';
        productModal.classList.add('active');
    });
}

// Close product modal
const productModalClose = document.getElementById('productModalClose');
const cancelProductBtn = document.getElementById('cancelProductBtn');
if (productModalClose) productModalClose.addEventListener('click', () => productModal.classList.remove('active'));
if (cancelProductBtn) cancelProductBtn.addEventListener('click', () => productModal.classList.remove('active'));

// Save product
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productData = {
            title: document.getElementById('productTitle').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            original_price: parseFloat(document.getElementById('productOriginalPrice').value) || null,
            image_url: document.getElementById('productImage').value.trim(),
            badge: document.getElementById('productBadge').value.trim(),
            is_active: document.getElementById('productActive').checked,
            sort_order: parseInt(document.getElementById('productSortOrder').value) || 0,
            updated_at: new Date().toISOString()
        };

        try {
            if (editingProductId) {
                const { error } = await supabase.from('products').update(productData).eq('id', editingProductId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert(productData);
                if (error) throw error;
            }
            productModal.classList.remove('active');
            loadProducts();
            loadOverviewData();
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
    });
}

window.editProduct = async function(id) {
    editingProductId = id;
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('productModalTitle').textContent = 'แก้ไขสินค้า';
    document.getElementById('productTitle').value = p.title || '';
    document.getElementById('productDescription').value = p.description || '';
    document.getElementById('productPrice').value = p.price || '';
    document.getElementById('productOriginalPrice').value = p.original_price || '';
    document.getElementById('productImage').value = p.image_url || '';
    document.getElementById('productBadge').value = p.badge || '';
    document.getElementById('productActive').checked = p.is_active !== false;
    document.getElementById('productSortOrder').value = p.sort_order || 0;
    productModal.classList.add('active');
};

window.deleteProduct = async function(id) {
    if (!confirm('ต้องการลบสินค้านี้?')) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        loadProducts();
        loadOverviewData();
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
};

// ===== Orders Management =====
async function loadOrders() {
    const ordersTableBody = document.getElementById('ordersTableBody');
    const ordersEmpty = document.getElementById('ordersEmpty');
    if (!ordersTableBody) return;

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            document.getElementById('ordersTable').style.display = 'none';
            if (ordersEmpty) ordersEmpty.style.display = 'block';
            return;
        }

        document.getElementById('ordersTable').style.display = '';
        if (ordersEmpty) ordersEmpty.style.display = 'none';

        const statusLabels = {
            pending: '⏳ รอดำเนินการ',
            confirmed: '✅ ยืนยันแล้ว',
            shipped: '🚚 จัดส่งแล้ว',
            completed: '🎉 สำเร็จ',
            cancelled: '❌ ยกเลิก'
        };

        ordersTableBody.innerHTML = orders.map(o => {
            const date = new Date(o.created_at).toLocaleDateString('th-TH');
            return `
                <tr>
                    <td>${date}</td>
                    <td><strong style="color:var(--text-white)">${o.customer_name}</strong><br><small>${o.customer_phone}</small></td>
                    <td>${o.product_title}</td>
                    <td>${o.quantity}</td>
                    <td>฿${Number(o.total_price).toLocaleString()}</td>
                    <td>
                        <select class="order-status-select" onchange="window.updateOrderStatus('${o.id}', this.value)">
                            ${Object.entries(statusLabels).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (error) throw error;
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
};

// Load all data
loadProducts();
loadOrders();
