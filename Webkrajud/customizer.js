/* ================================================
   Krajood Craft — 3D Customizer Script
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Color Palette Configuration
    const colors = [
        { id: 'natural', name: 'น้ำตาลธรรมชาติ', hex: '#D4C3A3' },
        { id: 'indigo', name: 'น้ำเงินคราม', hex: '#2B3E60' },
        { id: 'terracotta', name: 'แดงดินเผา', hex: '#A64B2A' },
        { id: 'forest', name: 'เขียวป่าไม้', hex: '#3D5232' },
        { id: 'mustard', name: 'เหลืองมัสตาร์ด', hex: '#CBB154' },
        { id: 'charcoal', name: 'ดำชาโคล', hex: '#2B2B2B' },
        { id: 'cream', name: 'สีครีมฟอก', hex: '#F2EADA' }
    ];

    // 2. Customizer State
    let state = {
        model: 'coaster', // coaster, keychain, tissuebox
        pattern: 'plain', // plain, twill, pikul
        primaryColor: colors[0], // natural
        secondaryColor: colors[1], // indigo
        autoRotate: true
    };

    // Product pricing configurations
    const pricing = {
        coaster: 150,
        keychain: 99,
        tissuebox: 390
    };

    // 3. Three.js variables
    let scene, camera, renderer, controls;
    let currentModelGroup;
    let canvasContainer = document.getElementById('canvas3d-container');
    let loaderElement = document.getElementById('canvasLoader');

    // Materials reference
    let cachedMaterials = {};

    // Initialize UI
    initUI();

    // Initialize Three.js Scene
    init3D();

    // 4. Initialize UI Selectors
    function initUI() {
        const primarySelector = document.getElementById('primary-color-selector');
        const secondarySelector = document.getElementById('secondary-color-selector');

        if (!primarySelector || !secondarySelector) return;

        // Render Primary Colors
        colors.forEach((color, idx) => {
            const btn = document.createElement('button');
            btn.className = `btn-color${idx === 0 ? ' active' : ''}`;
            btn.style.backgroundColor = color.hex;
            btn.title = color.name;
            btn.setAttribute('data-color', color.id);
            btn.addEventListener('click', () => {
                document.querySelectorAll('#primary-color-selector .btn-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.primaryColor = color;
                updateDesign();
            });
            primarySelector.appendChild(btn);
        });

        // Render Secondary Colors
        colors.forEach((color, idx) => {
            const btn = document.createElement('button');
            btn.className = `btn-color${idx === 1 ? ' active' : ''}`;
            btn.style.backgroundColor = color.hex;
            btn.title = color.name;
            btn.setAttribute('data-color', color.id);
            btn.addEventListener('click', () => {
                document.querySelectorAll('#secondary-color-selector .btn-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.secondaryColor = color;
                updateDesign();
            });
            secondarySelector.appendChild(btn);
        });

        // Model selector buttons
        document.querySelectorAll('.btn-model').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-model').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.model = btn.getAttribute('data-model');
                updateModelGeometry();
                updateDesignSummary();
            });
        });

        // Pattern selector buttons
        document.querySelectorAll('.btn-pattern').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-pattern').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.pattern = btn.getAttribute('data-pattern');
                updateDesign();
            });
        });

        // Control Panel buttons
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');
        const btnRotate = document.getElementById('btn-rotate-auto');
        const btnReset = document.getElementById('btn-reset-view');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => {
            if (camera) {
                camera.position.multiplyScalar(0.8);
                controls.update();
            }
        });

        if (btnZoomOut) btnZoomOut.addEventListener('click', () => {
            if (camera) {
                camera.position.multiplyScalar(1.2);
                controls.update();
            }
        });

        if (btnRotate) btnRotate.addEventListener('click', () => {
            state.autoRotate = !state.autoRotate;
            controls.autoRotate = state.autoRotate;
            btnRotate.classList.toggle('active', state.autoRotate);
        });

        if (btnReset) btnReset.addEventListener('click', () => {
            resetView();
        });

        // Custom Order Action Mockup
        const btnOrder = document.getElementById('btnOrderCustom');
        if (btnOrder) {
            btnOrder.addEventListener('click', () => {
                // Success popup/animation
                const originalText = btnOrder.innerHTML;
                btnOrder.innerHTML = '✓ รับข้อมูลแบบของคุณแล้ว!';
                btnOrder.style.backgroundColor = '#2ECC71';
                btnOrder.style.borderColor = '#2ECC71';

                // Log or alert detailed customization info
                console.log('Custom Design Order Submitted:', {
                    product: state.model,
                    pattern: state.pattern,
                    primaryColor: state.primaryColor.name,
                    secondaryColor: state.secondaryColor.name,
                    price: pricing[state.model]
                });

                setTimeout(() => {
                    btnOrder.innerHTML = originalText;
                    btnOrder.style.backgroundColor = '';
                    btnOrder.style.borderColor = '';
                }, 3000);
            });
        }
    }

    // 5. Procedural Texture Painter (Hidden Canvas)
    function generateWeaveTextures(pattern, primaryHex, secondaryHex, isTissueTop = false) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        // Draw base backgrounds
        ctx.fillStyle = primaryHex;
        ctx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = '#808080';
        bumpCtx.fillRect(0, 0, size, size);

        // Pattern Render Loop
        if (pattern === 'plain') {
            const gridCount = 16;
            const cellSize = size / gridCount;

            for (let x = 0; x < gridCount; x++) {
                for (let y = 0; y < gridCount; y++) {
                    const isHorizontal = (x + y) % 2 === 0;
                    const color = isHorizontal ? primaryHex : secondaryHex;

                    // Fill solid base color
                    ctx.fillStyle = color;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Add fiber gradient shading for a 3D cylindrical look
                    const grad = isHorizontal
                        ? ctx.createLinearGradient(0, y * cellSize, 0, (y + 1) * cellSize)
                        : ctx.createLinearGradient(x * cellSize, 0, (x + 1) * cellSize, 0);
                    grad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
                    grad.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
                    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
                    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

                    ctx.fillStyle = grad;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Draw Bump Map: white is high/raised, black is low/recessed
                    const bumpGrad = isHorizontal
                        ? bumpCtx.createLinearGradient(0, y * cellSize, 0, (y + 1) * cellSize)
                        : bumpCtx.createLinearGradient(x * cellSize, 0, (x + 1) * cellSize, 0);
                    bumpGrad.addColorStop(0, '#2b2b2b');
                    bumpGrad.addColorStop(0.5, '#ffffff');
                    bumpGrad.addColorStop(1, '#2b2b2b');
                    bumpCtx.fillStyle = bumpGrad;
                    bumpCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Subtle grassy strands details (inner fibers)
                    ctx.strokeStyle = isHorizontal ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
                    ctx.lineWidth = 1;
                    if (isHorizontal) {
                        for (let dy = 2; dy < cellSize; dy += 4) {
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize, y * cellSize + dy);
                            ctx.lineTo((x + 1) * cellSize, y * cellSize + dy);
                            ctx.stroke();
                        }
                    } else {
                        for (let dx = 2; dx < cellSize; dx += 4) {
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize + dx, y * cellSize);
                            ctx.lineTo(x * cellSize + dx, (y + 1) * cellSize);
                            ctx.stroke();
                        }
                    }
                }
            }
        } else if (pattern === 'twill') {
            const gridCount = 20;
            const cellSize = size / gridCount;

            for (let x = 0; x < gridCount; x++) {
                for (let y = 0; y < gridCount; y++) {
                    // Twill diagonal weave formula
                    const isHorizontal = (x - y) % 4 === 0 || (x - y) % 4 === 1 || (x - y) % 4 === -3 || (x - y) % 4 === -2;
                    const color = isHorizontal ? primaryHex : secondaryHex;

                    ctx.fillStyle = color;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    const grad = isHorizontal
                        ? ctx.createLinearGradient(0, y * cellSize, 0, (y + 1) * cellSize)
                        : ctx.createLinearGradient(x * cellSize, 0, (x + 1) * cellSize, 0);
                    grad.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
                    grad.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
                    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
                    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    const bumpGrad = isHorizontal
                        ? bumpCtx.createLinearGradient(0, y * cellSize, 0, (y + 1) * cellSize)
                        : bumpCtx.createLinearGradient(x * cellSize, 0, (x + 1) * cellSize, 0);
                    bumpGrad.addColorStop(0, '#1c1c1c');
                    bumpGrad.addColorStop(0.5, '#ffffff');
                    bumpGrad.addColorStop(1, '#1c1c1c');
                    bumpCtx.fillStyle = bumpGrad;
                    bumpCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Subtle grassy strands details
                    ctx.strokeStyle = isHorizontal ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                    ctx.lineWidth = 1;
                    if (isHorizontal) {
                        for (let dy = 2; dy < cellSize; dy += 4) {
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize, y * cellSize + dy);
                            ctx.lineTo((x + 1) * cellSize, y * cellSize + dy);
                            ctx.stroke();
                        }
                    } else {
                        for (let dx = 2; dx < cellSize; dx += 4) {
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize + dx, y * cellSize);
                            ctx.lineTo(x * cellSize + dx, (y + 1) * cellSize);
                            ctx.stroke();
                        }
                    }
                }
            }
        } else if (pattern === 'pikul') {
            // Traditional Pikul pattern (star weave)
            ctx.fillStyle = primaryHex;
            ctx.fillRect(0, 0, size, size);
            bumpCtx.fillStyle = '#808080';
            bumpCtx.fillRect(0, 0, size, size);

            // Draw a subtle weave canvas grid background first
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            for (let i = 0; i < size; i += 16) {
                ctx.fillRect(i, 0, 4, size);
                ctx.fillRect(0, i, size, 4);
            }

            const gridCount = 8;
            const cellSize = size / gridCount;

            for (let x = 0; x < gridCount; x++) {
                for (let y = 0; y < gridCount; y++) {
                    const cx = (x + 0.5) * cellSize;
                    const cy = (y + 0.5) * cellSize;
                    const r = cellSize * 0.44;

                    // Draw color star spokes
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.strokeStyle = secondaryHex;
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';

                    bumpCtx.save();
                    bumpCtx.translate(cx, cy);
                    bumpCtx.strokeStyle = '#ffffff';
                    bumpCtx.lineWidth = 6;
                    bumpCtx.lineCap = 'round';

                    for (let a = 0; a < 4; a++) {
                        ctx.beginPath();
                        ctx.moveTo(-r, 0);
                        ctx.lineTo(r, 0);
                        ctx.stroke();

                        // Shading highlights on the star rays
                        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(-r, -1);
                        ctx.lineTo(r, -1);
                        ctx.stroke();
                        ctx.strokeStyle = secondaryHex;
                        ctx.lineWidth = 4;

                        bumpCtx.beginPath();
                        bumpCtx.moveTo(-r, 0);
                        bumpCtx.lineTo(r, 0);
                        bumpCtx.stroke();

                        ctx.rotate(Math.PI / 4);
                        bumpCtx.rotate(Math.PI / 4);
                    }

                    // Draw center dot
                    ctx.fillStyle = primaryHex;
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = secondaryHex;
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Bump map raised center
                    bumpCtx.fillStyle = '#ffffff';
                    bumpCtx.beginPath();
                    bumpCtx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
                    bumpCtx.fill();

                    ctx.restore();
                    bumpCtx.restore();
                }
            }
        }

        // Draw Tissue Box top slit if required
        if (isTissueTop) {
            const slitW = size * 0.7;
            const slitH = size * 0.16;
            
            // Draw slot opening (shadow/hole)
            ctx.fillStyle = '#1A1815';
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2, slitW / 2, slitH / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Bump slot (recessed, deep black)
            bumpCtx.fillStyle = '#000000';
            bumpCtx.beginPath();
            bumpCtx.ellipse(size / 2, size / 2, slitW / 2, slitH / 2, 0, 0, Math.PI * 2);
            bumpCtx.fill();
        }

        // Create ThreeJS Textures
        const map = new THREE.CanvasTexture(canvas);
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;

        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        bumpMap.wrapS = THREE.RepeatWrapping;
        bumpMap.wrapT = THREE.RepeatWrapping;

        // Tile repetition
        if (pattern !== 'pikul') {
            map.repeat.set(2, 2);
            bumpMap.repeat.set(2, 2);
        } else {
            map.repeat.set(1, 1);
            bumpMap.repeat.set(1, 1);
        }

        return { map, bumpMap };
    }

    // 6. Initialize Three.js Scene
    function init3D() {
        if (!canvasContainer) return;

        // Create Scene
        scene = new THREE.Scene();

        // Canvas container size
        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight || 400;

        // Camera setup
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 3, 5);

        // Renderer setup with alpha transparency
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear existing canvas elements
        const oldCanvas = canvasContainer.querySelector('canvas');
        if (oldCanvas) canvasContainer.removeChild(oldCanvas);

        canvasContainer.appendChild(renderer.domElement);

        // Hide loader when rendering starts
        if (loaderElement) {
            loaderElement.style.display = 'none';
        }

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambientLight);

        // Main Warm Sun Light (Shadow-casting)
        const dirLight = new THREE.DirectionalLight(0xfff5eb, 0.85);
        dirLight.position.set(4, 7, 4);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 15;
        const d = 3;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.0005;
        scene.add(dirLight);

        // Cool Fill Light for shadow detail
        const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.3);
        fillLight.position.set(-4, 3, -4);
        scene.add(fillLight);

        // OrbitControls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents camera going below the ground
        controls.minDistance = 2;
        controls.maxDistance = 8;
        controls.autoRotate = state.autoRotate;
        controls.autoRotateSpeed = 1.5;

        // Ground Shadow Plane (Receives shadow to ground the objects)
        const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.7;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // Setup base empty group
        currentModelGroup = new THREE.Group();
        scene.add(currentModelGroup);

        // Render Initial Geometry
        updateModelGeometry();

        // Start Animation Loop
        animate();

        // Responsive Resize Handler
        window.addEventListener('resize', onWindowResize);
    }

    // 7. Render Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        if (controls) {
            controls.update();
        }

        // Subtle floating/idle animation for keychain specifically
        if (state.model === 'keychain' && currentModelGroup && !controls.state === -1) {
            const time = performance.now() * 0.001;
            currentModelGroup.position.y = Math.sin(time * 2.0) * 0.04;
        } else if (currentModelGroup) {
            currentModelGroup.position.y = 0;
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // Window Resize logic
    function onWindowResize() {
        if (!canvasContainer || !camera || !renderer) return;

        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight || 400;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    // 8. Generate and apply dynamic textures/materials
    function updateDesign() {
        // Clear cached materials so textures regenerate
        cachedMaterials = {};

        // Generate Textures
        const textures = generateWeaveTextures(state.pattern, state.primaryColor.hex, state.secondaryColor.hex, false);
        const topTextures = generateWeaveTextures(state.pattern, state.primaryColor.hex, state.secondaryColor.hex, true);

        // Materials setup
        const standardMaterial = new THREE.MeshStandardMaterial({
            map: textures.map,
            bumpMap: textures.bumpMap,
            bumpScale: 0.02,
            roughness: 0.85,
            metalness: 0.05
        });

        const tissueTopMaterial = new THREE.MeshStandardMaterial({
            map: topTextures.map,
            bumpMap: topTextures.bumpMap,
            bumpScale: 0.02,
            roughness: 0.85,
            metalness: 0.05
        });

        // Loop through meshes in our active group and update materials
        currentModelGroup.traverse(child => {
            if (child.isMesh) {
                // Keep metal parts metallic!
                if (child.name === 'metal_ring' || child.name === 'metal_clasp') {
                    return; // Don't overwrite the ring/clasp materials
                }
                
                if (child.name === 'tissue_paper') {
                    return; // Don't overwrite tissue paper
                }

                // If coaster side, apply plain border look
                if (child.name === 'coaster_side') {
                    child.material = new THREE.MeshStandardMaterial({
                        color: state.primaryColor.hex,
                        roughness: 0.9,
                        metalness: 0.02
                    });
                    return;
                }

                // Handle tissue box top with slot
                if (child.name === 'tissue_top') {
                    child.material = tissueTopMaterial;
                } else {
                    child.material = standardMaterial;
                }
            }
        });

        updateDesignSummary();
    }

    // 9. Rebuild mesh geometry when model switches
    function updateModelGeometry() {
        if (!scene || !currentModelGroup) return;

        // Remove old meshes from group
        while (currentModelGroup.children.length > 0) {
            const obj = currentModelGroup.children[0];
            currentModelGroup.remove(obj);
        }

        // Generate textures for coloring
        const textures = generateWeaveTextures(state.pattern, state.primaryColor.hex, state.secondaryColor.hex, false);
        const topTextures = generateWeaveTextures(state.pattern, state.primaryColor.hex, state.secondaryColor.hex, true);

        const craftMaterial = new THREE.MeshStandardMaterial({
            map: textures.map,
            bumpMap: textures.bumpMap,
            bumpScale: 0.025,
            roughness: 0.88,
            metalness: 0.05
        });

        const tissueTopMaterial = new THREE.MeshStandardMaterial({
            map: topTextures.map,
            bumpMap: topTextures.bumpMap,
            bumpScale: 0.025,
            roughness: 0.88,
            metalness: 0.05
        });

        if (state.model === 'coaster') {
            // Coaster: Cylinder disc
            const coasterGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.08, 64);
            
            // Create a braided edge border material
            const borderMaterial = new THREE.MeshStandardMaterial({
                color: state.primaryColor.hex,
                roughness: 0.9,
                metalness: 0.02
            });

            // Coaster has 3 material faces (0: side, 1: top, 2: bottom)
            const coasterMesh = new THREE.Mesh(coasterGeo, [borderMaterial, craftMaterial, craftMaterial]);
            coasterMesh.name = 'coaster_main';
            coasterMesh.castShadow = true;
            coasterMesh.receiveShadow = true;
            coasterMesh.position.y = -0.4;
            
            currentModelGroup.add(coasterMesh);
            
            // Set camera position for nice flat view
            gsapCameraPosition(0, 2.2, 2.8, 0, -0.4, 0);

        } else if (state.model === 'keychain') {
            // Keychain: Flat woven strap + Metal ring + Clasp
            const strapGeo = new THREE.BoxGeometry(0.55, 1.4, 0.06);
            const strapMesh = new THREE.Mesh(strapGeo, craftMaterial);
            strapMesh.name = 'keychain_strap';
            strapMesh.castShadow = true;
            strapMesh.receiveShadow = true;
            strapMesh.position.set(0, -0.2, 0);
            currentModelGroup.add(strapMesh);

            // Metal Clasp/Eyelet
            const claspGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 16);
            const metalMaterial = new THREE.MeshStandardMaterial({
                color: 0xD4AF37, // Gold brass finish
                metalness: 0.9,
                roughness: 0.12
            });
            const claspMesh = new THREE.Mesh(claspGeo, metalMaterial);
            claspMesh.name = 'metal_clasp';
            claspMesh.position.set(0, 0.54, 0);
            claspMesh.rotation.z = Math.PI / 2;
            claspMesh.castShadow = true;
            currentModelGroup.add(claspMesh);

            // Metal Ring
            const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 16, 32);
            const ringMesh = new THREE.Mesh(ringGeo, metalMaterial);
            ringMesh.name = 'metal_ring';
            ringMesh.position.set(0, 0.74, 0);
            ringMesh.rotation.x = Math.PI / 2.3; // Hang at angle
            ringMesh.castShadow = true;
            currentModelGroup.add(ringMesh);

            // Position camera slightly closer
            gsapCameraPosition(0, 1.2, 2.3, 0, 0.1, 0);

        } else if (state.model === 'tissuebox') {
            // Tissue Box: Composed box with a tissue sticking out
            // We use multi-materials for the box faces
            // Right, Left, Top, Bottom, Front, Back
            const materials = [
                craftMaterial, // Right
                craftMaterial, // Left
                tissueTopMaterial, // Top (with slot)
                craftMaterial, // Bottom
                craftMaterial, // Front
                craftMaterial  // Back
            ];

            const boxGeo = new THREE.BoxGeometry(2.1, 1.1, 1.1);
            // Assign custom names to materials to manage in dynamic updating
            const boxMesh = new THREE.Mesh(boxGeo, materials);
            boxMesh.name = 'tissue_box_main';
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            boxMesh.position.y = -0.15;
            currentModelGroup.add(boxMesh);

            // Add Tissue paper sticking out of the top slot
            const tissueGeo = new THREE.PlaneGeometry(0.7, 0.65, 16, 16);
            const pos = tissueGeo.attributes.position;
            
            // Modify geometry vertices to make a wavy cloth-like paper shape
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                // Wavy displacement logic
                const z = Math.sin(y * 7) * 0.1 + Math.cos(x * 4) * 0.04;
                pos.setZ(i, z + (y + 0.32) * 0.05); // fold forward
            }
            tissueGeo.computeVertexNormals();

            const tissueMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.9,
                side: THREE.DoubleSide
            });

            const tissueMesh = new THREE.Mesh(tissueGeo, tissueMaterial);
            tissueMesh.name = 'tissue_paper';
            tissueMesh.position.set(0, 0.44, 0);
            tissueMesh.rotation.x = -Math.PI / 2.3;
            tissueMesh.castShadow = true;
            currentModelGroup.add(tissueMesh);

            // Adjust camera view for larger object
            gsapCameraPosition(0, 2.5, 3.8, 0, -0.1, 0);
        }

        // Run design update to map textures
        updateDesign();
    }

    // 10. Camera transitions helper
    function gsapCameraPosition(px, py, pz, tx, ty, tz) {
        if (!camera || !controls) return;
        
        // Simple fallback without external libraries
        camera.position.set(px, py, pz);
        controls.target.set(tx, ty, tz);
        controls.update();
    }

    // Reset view position
    function resetView() {
        if (state.model === 'coaster') {
            gsapCameraPosition(0, 2.2, 2.8, 0, -0.4, 0);
        } else if (state.model === 'keychain') {
            gsapCameraPosition(0, 1.2, 2.3, 0, 0.1, 0);
        } else if (state.model === 'tissuebox') {
            gsapCameraPosition(0, 2.5, 3.8, 0, -0.1, 0);
        }
    }

    // 11. Sync and render customization panel summary details
    function updateDesignSummary() {
        const sumModel = document.getElementById('sum-model');
        const sumPattern = document.getElementById('sum-pattern');
        const sumPrimary = document.getElementById('sum-primary');
        const sumSecondary = document.getElementById('sum-secondary');
        const sumPrice = document.getElementById('sum-price');

        const modelNames = {
            coaster: 'ที่รองแก้วน้ำ',
            keychain: 'พวงกุญแจกระจูด',
            tissuebox: 'กล่องใส่ทิชชู่'
        };

        const patternNames = {
            plain: 'ลายขัด (Plain Weave)',
            twill: 'ลายสอง (Twill Weave)',
            pikul: 'ลายดอกพิกุล (Pikul Weave)'
        };

        if (sumModel) sumModel.textContent = modelNames[state.model];
        if (sumPattern) sumPattern.textContent = patternNames[state.pattern];
        if (sumPrimary) sumPrimary.textContent = state.primaryColor.name;
        if (sumSecondary) sumSecondary.textContent = state.secondaryColor.name;
        if (sumPrice) sumPrice.textContent = `฿${pricing[state.model]}`;
    }
});
