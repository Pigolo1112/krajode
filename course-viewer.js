/* ================================================
   Krajood Craft — Course Viewer Logic (Supabase)
   ================================================ */

import { supabase } from './supabase-config.js';

// ===== Get Course ID from URL =====
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

if (!courseId) {
    window.location.href = 'courses.html';
}

// ===== DOM Elements =====
const courseTitle = document.getElementById('courseTitle');
const courseMeta = document.getElementById('courseMeta');
const courseDescription = document.getElementById('courseDescription');
const courseDescCard = document.getElementById('courseDescCard');
const videoLoading = document.getElementById('videoLoading');
const videoContainer = document.getElementById('videoContainer');
const videoWrapper = document.getElementById('videoWrapper');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const clipDetails = document.getElementById('clipDetails');
const clipStep = document.getElementById('clipStep');
const clipTitle = document.getElementById('clipTitle');
const clipDescription = document.getElementById('clipDescription');
const clipDuration = document.getElementById('clipDuration');
const clipsList = document.getElementById('clipsList');
const clipCount = document.getElementById('clipCount');
const userInfo = document.getElementById('userInfo');
const loginBtn = document.getElementById('loginBtn');
const userAvatar = document.getElementById('userAvatar');

// ===== Auth State =====
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';

        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            userAvatar.textContent = (profile.name || 'U').charAt(0).toUpperCase();
        }
    } else {
        loginBtn.style.display = '';
        userInfo.style.display = 'none';
    }
}

checkAuth();

// ===== Load Course =====
let allClips = [];
let currentClipIndex = -1;

async function loadCourse() {
    try {
        // Load course data
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError || !courseData) {
            courseTitle.textContent = 'ไม่พบคอร์ส';
            videoLoading.innerHTML = `
                <span style="font-size:3rem">😕</span>
                <p>ไม่พบคอร์สที่ต้องการ</p>
                <a href="courses.html" style="color:var(--accent-light); margin-top:10px;">← กลับหน้าคอร์สเรียน</a>
            `;
            return;
        }

        const levelLabels = {
            beginner: 'ระดับเริ่มต้น',
            intermediate: 'ระดับกลาง',
            advanced: 'ระดับสูง'
        };

        courseTitle.textContent = courseData.title;
        document.title = `${courseData.title} | Krajood Craft`;
        courseMeta.textContent = levelLabels[courseData.level] || courseData.level;
        courseDescription.textContent = courseData.description || '';

        // Load clips
        const { data: clips, error: clipsError } = await supabase
            .from('clips')
            .select('*')
            .eq('course_id', courseId)
            .order('sort_order');

        if (clipsError) throw clipsError;

        allClips = clips || [];
        clipCount.textContent = `${allClips.length} คลิป`;

        // Hide loading, show content
        videoLoading.style.display = 'none';
        videoContainer.style.display = '';

        // Render clips list
        renderClipsList();

        // Auto-play first clip if available
        if (allClips.length > 0) {
            playClip(0);
        }

    } catch (error) {
        console.error('Error loading course:', error);
        videoLoading.innerHTML = `
            <span style="font-size:3rem">⚠️</span>
            <p>เกิดข้อผิดพลาดในการโหลดคอร์ส</p>
            <p style="font-size:0.85rem; color: var(--text-muted);">${error.message}</p>
        `;
    }
}

// ===== Render Clips List =====
function renderClipsList() {
    if (allClips.length === 0) {
        clipsList.innerHTML = `
            <div class="no-clips">
                <span>📭</span>
                <p>ยังไม่มีคลิปในคอร์สนี้</p>
            </div>
        `;
        return;
    }

    clipsList.innerHTML = allClips.map((clip, idx) => `
        <div class="clip-list-item" data-index="${idx}" id="clip-item-${idx}">
            <div class="clip-list-number">${clip.sort_order || idx + 1}</div>
            <div class="clip-list-info">
                <div class="clip-list-title">${clip.title}</div>
                <div class="clip-list-meta">${clip.duration ? '⏱ ' + clip.duration : ''}</div>
                <div class="clip-list-playing">▶ กำลังเล่น</div>
            </div>
        </div>
    `).join('');

    // Click handlers
    clipsList.querySelectorAll('.clip-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            playClip(idx);

            // Close mobile sidebar
            document.getElementById('clipsSidebar').classList.remove('open');
        });
    });
}

// ===== Play Clip =====
function playClip(index) {
    if (index < 0 || index >= allClips.length) return;

    currentClipIndex = index;
    const clip = allClips[index];

    // Update active state in sidebar
    clipsList.querySelectorAll('.clip-list-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.getElementById(`clip-item-${index}`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Show clip details
    clipDetails.style.display = '';
    clipStep.textContent = `Step ${clip.sort_order || index + 1}`;
    clipTitle.textContent = clip.title;
    clipDescription.textContent = clip.description || 'ไม่มีคำอธิบาย';
    clipDuration.textContent = clip.duration ? `⏱ ${clip.duration}` : '';

    // Play video
    if (clip.video_url) {
        videoPlaceholder.style.display = 'none';

        if (clip.video_type === 'youtube' || isYouTubeURL(clip.video_url)) {
            const videoId = extractYouTubeId(clip.video_url);
            if (videoId) {
                videoWrapper.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        title="${clip.title}">
                    </iframe>
                `;
            } else {
                showVideoError('ลิงก์ YouTube ไม่ถูกต้อง');
            }
        } else {
            // HTML5 Video
            videoWrapper.innerHTML = `
                <video controls autoplay>
                    <source src="${clip.video_url}" type="video/mp4">
                    เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
                </video>
            `;
        }
    } else {
        videoWrapper.innerHTML = '';
        videoPlaceholder.style.display = '';
        videoPlaceholder.innerHTML = `
            <span>🎥</span>
            <p>คลิปนี้ยังไม่มีวิดีโอ<br>กรุณาติดต่อผู้ดูแลระบบ</p>
        `;
        videoWrapper.appendChild(videoPlaceholder);
    }
}

function showVideoError(message) {
    videoWrapper.innerHTML = `
        <div class="video-placeholder">
            <span>⚠️</span>
            <p>${message}</p>
        </div>
    `;
}

// ===== YouTube URL Helpers =====
function isYouTubeURL(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// ===== Mobile Clips Toggle =====
const mobileToggle = document.getElementById('mobileClipsToggle');
const clipsSidebar = document.getElementById('clipsSidebar');

mobileToggle.addEventListener('click', () => {
    clipsSidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 &&
        clipsSidebar.classList.contains('open') &&
        !clipsSidebar.contains(e.target) &&
        !mobileToggle.contains(e.target)) {
        clipsSidebar.classList.remove('open');
    }
});

// ===== Keyboard Navigation =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'n') {
        if (currentClipIndex < allClips.length - 1) {
            playClip(currentClipIndex + 1);
        }
    } else if (e.key === 'ArrowLeft' || e.key === 'p') {
        if (currentClipIndex > 0) {
            playClip(currentClipIndex - 1);
        }
    }
});

// ===== Init =====
loadCourse();
