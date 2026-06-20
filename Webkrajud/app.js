/* ================================================
   สานเสน่ห์กระจูด — Main Application Script
   ================================================ */

// ===== Supabase Auth Integration =====
import { supabase } from './supabase-config.js';

// Auth state listener for header
const authLoginBtn = document.getElementById('authLoginBtn');
const userMenuHeader = document.getElementById('userMenuHeader');
const userAvatarSm = document.getElementById('userAvatarSm');
const userNameSm = document.getElementById('userNameSm');
const headerLogoutBtn = document.getElementById('headerLogoutBtn');

async function initAuth() {
    if (!authLoginBtn || !userMenuHeader) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        authLoginBtn.style.display = 'none';
        userMenuHeader.style.display = 'flex';

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                userNameSm.textContent = profile.name || session.user.email || 'ผู้ใช้';
                userAvatarSm.textContent = (profile.name || 'U').charAt(0).toUpperCase();
            } else {
                userNameSm.textContent = session.user.email || 'ผู้ใช้';
                userAvatarSm.textContent = 'U';
            }
        } catch (e) {
            console.log('Supabase not configured yet');
        }
    } else {
        authLoginBtn.style.display = '';
        userMenuHeader.style.display = 'none';
    }

    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
}

initAuth();


document.addEventListener('DOMContentLoaded', () => {

    // ===== HEADER SCROLL EFFECT =====
    const header = document.getElementById('header');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    const handleScroll = () => {
        if (!header || !scrollTopBtn) return;
        const scrollY = window.scrollY;

        // Header style change on scroll
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Scroll to top button visibility
        if (scrollY > 600) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }

        // Update active nav link based on scroll position
        updateActiveNavLink();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Scroll to top
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ===== MOBILE MENU TOGGLE =====
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('open');
            document.body.style.overflow = mainNav.classList.contains('open') ? 'hidden' : '';
        });

        // Close mobile menu when clicking a nav link
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }


    // ===== ACTIVE NAV LINK TRACKING =====
    function updateActiveNavLink() {
        if (!mainNav) return;
        const sections = document.querySelectorAll('section[id]');
        const navLinks = mainNav.querySelectorAll('a[href^="#"]');
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }


    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target && header) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    // ===== REVEAL ON SCROLL ANIMATION =====
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ===== STAT COUNTER ANIMATION =====
    function animateCounter(element, target, suffix = '', prefix = '') {
        if (!element) return; // Safety check
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        const isFloat = target % 1 !== 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;

            if (isFloat) {
                element.textContent = `${prefix}${current.toFixed(1)}${suffix}`;
            } else {
                element.textContent = `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Observe stats section
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(document.getElementById('stat-students'), 1, '+');
                    animateCounter(document.getElementById('stat-courses'), 1, '+');
                    animateCounter(document.getElementById('stat-rating'), 1);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    }


    // ===== COURSE TABS FILTER =====
    const courseTabs = document.querySelectorAll('.course-tab');
    const courseCards = document.querySelectorAll('.course-card');

    courseTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            courseTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');

            courseCards.forEach(card => {
                const level = card.getAttribute('data-level');

                if (filter === 'all' || level === filter) {
                    card.style.display = '';
                    card.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // CSS for filter animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);


    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all FAQ items
            faqItems.forEach(i => i.classList.remove('active'));

            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });


    // ===== GALLERY LIGHTBOX =====
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });


    // ===== NEWSLETTER FORM =====
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;

            if (email) {
                // Simulate success
                const button = newsletterForm.querySelector('button');
                const originalText = button.textContent;
                button.textContent = '✓ สำเร็จ!';
                button.style.background = '#2ECC71';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    document.getElementById('newsletter-email').value = '';
                }, 2500);
            }
        });
    }


    // ===== CART BUTTON INTERACTION =====
    const cartButtons = document.querySelectorAll('.btn-cart');

    cartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ เพิ่มแล้ว!';
            btn.style.background = '#2ECC71';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        });
    });


    // ===== PARALLAX EFFECT FOR HERO =====
    const heroContent = document.querySelector('.hero-content');

    if (heroContent) {
        window.addEventListener('scroll', () => {
            if (window.scrollY < window.innerHeight) {
                const parallaxOffset = window.scrollY * 0.3;
                heroContent.style.transform = `translateY(${parallaxOffset}px)`;
                heroContent.style.opacity = 1 - (window.scrollY / window.innerHeight) * 0.6;
            }
        }, { passive: true });
    }


    // ===== DARK MODE TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeIcon) themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                if (themeIcon) themeIcon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                if (themeIcon) themeIcon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // ===== LOAD COURSES FROM SUPABASE =====
    async function loadHomeCourses() {
        const grid = document.getElementById('homeCourseGrid');
        if (!grid) return;

        try {
            const config = await import('./supabase-config.js');
            const supabase = config.supabase;

            const { data: courses, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            if (!courses || courses.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                        <span style="font-size:3rem; display:block; margin-bottom:16px;">📚</span>
                        <p style="color:#777; font-size:1.1rem;">กำลังเตรียมคอร์สเรียน เร็วๆ นี้!</p>
                        <a href="courses.html" style="display:inline-block; margin-top:16px; color:var(--accent-light, #6B8A3E);">ดูทั้งหมด →</a>
                    </div>`;
                return;
            }

            const levelLabels = { beginner: 'ระดับเริ่มต้น', intermediate: 'ระดับกลาง', advanced: 'ระดับสูง' };

            grid.innerHTML = courses.map(c => `
                <div class="course-card" data-level="${c.level}" onclick="window.location.href='course-viewer.html?id=${c.id}'">
                    <div class="course-card-image">
                        <img src="${c.cover_image || 'images/hero_banner.png'}" alt="${c.title}" loading="lazy" onerror="this.src='images/hero_banner.png'">
                        <span class="course-level ${c.level}">${levelLabels[c.level] || c.level}</span>
                    </div>
                    <div class="course-card-body">
                        <h3>${c.title}</h3>
                        <p>${c.description || ''}</p>
                        <div class="course-meta">
                            <span class="lessons">🎥 ${c.clip_count || 0} คลิป</span>
                            <a href="course-viewer.html?id=${c.id}" class="course-link">เริ่มเรียน →</a>
                        </div>
                    </div>
                </div>
            `).join('');

            // Course filter tabs
            document.querySelectorAll('.course-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.course-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const filter = tab.dataset.filter;
                    grid.querySelectorAll('.course-card').forEach(card => {
                        card.style.display = (filter === 'all' || card.dataset.level === filter) ? '' : 'none';
                    });
                });
            });
        } catch (e) {
            console.error('Error loading courses:', e);
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#777;">ไม่สามารถโหลดคอร์สได้</div>';
        }
    }

    // ===== LOAD PRODUCTS FROM SUPABASE =====
    async function loadHomeProducts() {
        const grid = document.getElementById('homeShopGrid');
        if (!grid) return;

        try {
            const config = await import('./supabase-config.js');
            const supabase = config.supabase;

            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;

            if (!products || products.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                        <span style="font-size:3rem; display:block; margin-bottom:16px;">🛒</span>
                        <p style="color:#777; font-size:1.1rem;">กำลังเตรียมสินค้า เร็วๆ นี้!</p>
                    </div>`;
                return;
            }

            grid.innerHTML = products.map(p => `
                <div class="shop-card">
                    ${p.badge ? `<span class="shop-card-badge">${p.badge}</span>` : ''}
                    <div class="shop-card-image">
                        <img src="${p.image_url || 'images/shop_kit.png'}" alt="${p.title}" loading="lazy" onerror="this.src='images/shop_kit.png'">
                    </div>
                    <div class="shop-card-body">
                        <h3>${p.title}</h3>
                        <p>${p.description || ''}</p>
                        <div class="shop-price">
                            <span class="price">฿${Number(p.price).toLocaleString()} ${p.original_price ? `<span class="original">฿${Number(p.original_price).toLocaleString()}</span>` : ''}</span>
                            <button class="btn-cart" onclick="window.openOrderForm('${p.id}', '${p.title.replace(/'/g, "\\'")}', ${p.price})">🛒 สั่งซื้อ</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading products:', e);
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#777;">ไม่สามารถโหลดสินค้าได้</div>';
        }
    }

    // ===== ORDER FORM MODAL =====
    window.openOrderForm = function(productId, productTitle, price) {
        // สร้าง modal ถ้ายังไม่มี
        let modal = document.getElementById('orderModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'orderModal';
            modal.className = 'order-modal-overlay';
            modal.innerHTML = `
                <div class="order-modal">
                    <button class="order-modal-close" onclick="document.getElementById('orderModal').style.display='none'">&times;</button>
                    <h2>🛒 แบบฟอร์มสั่งซื้อ</h2>
                    <p class="order-product-name" id="orderProductName"></p>
                    <p class="order-product-price" id="orderProductPrice"></p>
                    <form id="orderForm">
                        <input type="hidden" id="orderProductId">
                        <input type="hidden" id="orderTotalPrice">
                        <div class="order-field">
                            <label>ชื่อ-นามสกุล *</label>
                            <input type="text" id="orderName" required placeholder="กรอกชื่อ-นามสกุล">
                        </div>
                        <div class="order-field">
                            <label>เบอร์โทรศัพท์ *</label>
                            <input type="tel" id="orderPhone" required placeholder="08x-xxx-xxxx">
                        </div>
                        <div class="order-field">
                            <label>อีเมล</label>
                            <input type="email" id="orderEmail" placeholder="example@email.com">
                        </div>
                        <div class="order-field">
                            <label>ที่อยู่จัดส่ง *</label>
                            <textarea id="orderAddress" required rows="3" placeholder="กรอกที่อยู่สำหรับจัดส่ง"></textarea>
                        </div>
                        <div class="order-field">
                            <label>จำนวน</label>
                            <input type="number" id="orderQty" value="1" min="1" max="10" onchange="document.getElementById('orderTotalDisplay').textContent = '฿' + (this.value * parseFloat(document.getElementById('orderTotalPrice').value)).toLocaleString()">
                        </div>
                        <div class="order-field">
                            <label>หมายเหตุ</label>
                            <textarea id="orderNote" rows="2" placeholder="ระบุสี, ขนาด หรือรายละเอียดเพิ่มเติม"></textarea>
                        </div>
                        <div class="order-total">
                            รวมทั้งหมด: <strong id="orderTotalDisplay"></strong>
                        </div>
                        <button type="submit" class="btn-order-submit">
                            <span class="btn-text">✅ ยืนยันสั่งซื้อ</span>
                            <span class="btn-loader" style="display:none;"></span>
                        </button>
                        <div id="orderMessage" style="display:none; margin-top:12px; text-align:center;"></div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Order submit handler
            document.getElementById('orderForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = modal.querySelector('.btn-order-submit');
                const msg = document.getElementById('orderMessage');
                btn.querySelector('.btn-text').style.display = 'none';
                btn.querySelector('.btn-loader').style.display = 'inline-block';
                btn.disabled = true;

                try {
                    const config = await import('./supabase-config.js');
                    const supabase = config.supabase;
                    const qty = parseInt(document.getElementById('orderQty').value) || 1;
                    const unitPrice = parseFloat(document.getElementById('orderTotalPrice').value);

                    const { error } = await supabase.from('orders').insert({
                        customer_name: document.getElementById('orderName').value.trim(),
                        customer_phone: document.getElementById('orderPhone').value.trim(),
                        customer_email: document.getElementById('orderEmail').value.trim(),
                        customer_address: document.getElementById('orderAddress').value.trim(),
                        product_id: document.getElementById('orderProductId').value,
                        product_title: document.getElementById('orderProductName').textContent,
                        quantity: qty,
                        total_price: unitPrice * qty,
                        note: document.getElementById('orderNote').value.trim()
                    });

                    if (error) throw error;

                    msg.style.display = 'block';
                    msg.style.color = '#2ECC71';
                    msg.textContent = '🎉 สั่งซื้อสำเร็จ! เราจะติดต่อกลับเร็วๆ นี้';
                    document.getElementById('orderForm').reset();
                    setTimeout(() => { modal.style.display = 'none'; msg.style.display = 'none'; }, 3000);
                } catch (err) {
                    msg.style.display = 'block';
                    msg.style.color = '#E74C3C';
                    msg.textContent = 'เกิดข้อผิดพลาด: ' + err.message;
                } finally {
                    btn.querySelector('.btn-text').style.display = '';
                    btn.querySelector('.btn-loader').style.display = 'none';
                    btn.disabled = false;
                }
            });

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        // Fill data
        document.getElementById('orderProductId').value = productId;
        document.getElementById('orderProductName').textContent = productTitle;
        document.getElementById('orderProductPrice').textContent = '฿' + Number(price).toLocaleString() + ' / ชิ้น';
        document.getElementById('orderTotalPrice').value = price;
        document.getElementById('orderTotalDisplay').textContent = '฿' + Number(price).toLocaleString();
        document.getElementById('orderQty').value = 1;
        modal.style.display = 'flex';
    };

    // Load data
    loadHomeCourses();
    loadHomeProducts();

});
