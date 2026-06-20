/* ================================================
   Krajood Craft — Courses Page Logic (Supabase)
   ================================================ */

import { supabase } from './supabase-config.js';

// ===== DOM Elements =====
const coursesGrid = document.getElementById('coursesGrid');
const emptyState = document.getElementById('emptyState');
const coursesCount = document.getElementById('coursesCount');
const filterTabs = document.querySelectorAll('.filter-tab');
const userMenu = document.getElementById('userMenu');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// ===== Auth State =====
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';

        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            userName.textContent = profile.name || session.user.email;
            userAvatar.textContent = (profile.name || 'U').charAt(0).toUpperCase();
        } else {
            userName.textContent = session.user.email;
            userAvatar.textContent = 'U';
        }
    } else {
        loginBtn.style.display = '';
        userMenu.style.display = 'none';
    }
}

checkAuth();

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

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

        if (allCourses.length === 0) {
            coursesGrid.innerHTML = '';
            emptyState.style.display = 'block';
            coursesCount.textContent = '0 คอร์ส';
            return;
        }

        emptyState.style.display = 'none';
        renderCourses(allCourses);
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #777;">
                <p>⚠️ เกิดข้อผิดพลาดในการโหลดคอร์ส</p>
                <p style="font-size:0.85rem; margin-top: 8px;">กรุณาตรวจสอบการเชื่อมต่อ Supabase</p>
            </div>
        `;
    }
}

function renderCourses(courses) {
    const levelLabels = {
        beginner: 'ระดับเริ่มต้น',
        intermediate: 'ระดับกลาง',
        advanced: 'ระดับสูง'
    };

    coursesCount.textContent = `${courses.length} คอร์ส`;

    coursesGrid.innerHTML = courses.map((course, idx) => {
        const date = new Date(course.created_at).toLocaleDateString('th-TH');
        return `
            <div class="course-card" style="animation-delay: ${idx * 0.1}s" onclick="window.location.href='course-viewer.html?id=${course.id}'">
                <div class="course-card-img">
                    <img src="${course.cover_image || 'images/hero_banner.png'}" alt="${course.title}" loading="lazy" onerror="this.src='images/hero_banner.png'">
                    <span class="course-card-level ${course.level}">${levelLabels[course.level] || course.level}</span>
                    <span class="course-card-clips">🎥 ${course.clip_count || 0} คลิป</span>
                </div>
                <div class="course-card-body">
                    <h3>${course.title}</h3>
                    <p>${course.description || ''}</p>
                    <div class="course-card-footer">
                        <span class="course-card-meta">${date}</span>
                        <span class="course-card-link">เข้าเรียน →</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Filter =====
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;

        if (filter === 'all') {
            renderCourses(allCourses);
        } else {
            const filtered = allCourses.filter(c => c.level === filter);
            if (filtered.length === 0) {
                coursesGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #777;">
                        <span style="font-size: 3rem; display: block; margin-bottom: 16px;">📭</span>
                        <p>ไม่พบคอร์สในระดับนี้</p>
                    </div>
                `;
                coursesCount.textContent = '0 คอร์ส';
            } else {
                renderCourses(filtered);
            }
        }
    });
});

// ===== Init =====
loadCourses();
