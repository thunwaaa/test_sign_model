document.addEventListener('DOMContentLoaded', function() {
    // ตัวแปรสำหรับการจัดการข้อมูล 3D
    let scene, camera, renderer, controls;
    let avatar;
    let wordData = null;
    let processedData = null;
    let currentFrameIndex = 0;
    let isPlaying = false;
    let animationSpeed = 1.0;
    let animationId = null;
    let lastTime = 0;
    let frameInterval = 1000 / 30; // FPS = 30
    
    // ตัวแปรสำหรับโมเดล
    let modelType = 'simple';
    let customModelPath = null;
    
    // เลือกอิลิเมนต์จาก DOM
    const wordSelect = document.getElementById('wordSelect');
    const videoSelect = document.getElementById('videoSelect');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const resetButton = document.getElementById('resetButton');
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    const modelSelect = document.getElementById('modelSelect');
    const wordInfo = document.getElementById('wordInfo');
    const status = document.getElementById('status');
    const frameInfo = document.getElementById('frameInfo');
    const container = document.getElementById('threejs-container');
    
    // ฟังก์ชันสำหรับเริ่มต้นแอปพลิเคชัน
    function init() {
        initThreeJS();
        loadWords();
        initEventListeners();
    }
    
    // ฟังก์ชันสำหรับตั้งค่า Three.js
    function initThreeJS() {
        // สร้างฉาก (Scene)
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // สร้างกล้อง (Camera)
        camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        camera.position.set(0, 1, 3);
        
        // สร้างตัวแสดงผล (Renderer)
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        // เพิ่มการควบคุมมุมมอง (OrbitControls)
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        
        // เพิ่มแสง (Light)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);
        
        // สร้างโมเดลตัวการ์ตูน
        createModel();
        
        // เพิ่มพื้น (Floor)
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
        scene.add(gridHelper);
        
        // เริ่มการเรนเดอร์
        animate();
        
        // จัดการการปรับขนาดหน้าต่าง
        window.addEventListener('resize', onWindowResize);
    }
    
    // ฟังก์ชันสำหรับสร้างโมเดล
    function createModel() {
        // ลบโมเดลเก่า (ถ้ามี)
        if (avatar && avatar.model) {
            scene.remove(avatar.model);
        }
        
        // สร้างโมเดลตามประเภทที่เลือก
        if (modelType === 'simple') {
            avatar = new AvatarModel(scene, 'simple');
        } else if (modelType === 'custom' && customModelPath) {
            avatar = new AvatarModel(scene, 'custom', customModelPath);
        } else {
            // ถ้าไม่มีพาธโมเดลสำเร็จรูป ใช้โมเดลแบบง่ายแทน
            avatar = new AvatarModel(scene, 'simple');
        }
    }
    
    // ฟังก์ชันสำหรับการเรนเดอร์
    function animate(time = 0) {
        animationId = requestAnimationFrame(animate);
        
        if (isPlaying && processedData) {
            const deltaTime = time - lastTime;
            
            if (deltaTime >= frameInterval / animationSpeed) {
                // อัปเดตโมเดล 3D ตามเฟรมปัจจุบัน
                updateAvatar();
                
                // เพิ่มเฟรมไปยังเฟรมถัดไป
                currentFrameIndex = (currentFrameIndex + 1) % processedData.length;
                
                // อัปเดตข้อมูลเฟรม
                updateFrameInfo();
                
                lastTime = time;
            }
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    // ฟังก์ชันสำหรับจัดการการปรับขนาดหน้าต่าง
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    // ฟังก์ชันสำหรับอัปเดตโมเดล 3D ตามข้อมูลเฟรมปัจจุบัน
    function updateAvatar() {
        if (processedData && currentFrameIndex < processedData.length) {
            console.log('Updating avatar with frame:', currentFrameIndex);
            console.log('Frame data:', processedData[currentFrameIndex]);
            
            // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
            if (!processedData[currentFrameIndex].hands || processedData[currentFrameIndex].hands.length === 0) {
                console.warn('No hand data in this frame');
            }
            
            avatar.update(processedData[currentFrameIndex]);
        } else {
            console.warn('No processed data available or invalid frame index');
        }
    }
    
    // ฟังก์ชันสำหรับโหลดรายการคำ
    function loadWords() {
        updateStatus("กำลังโหลดรายการคำ...");
        
        fetch('/words')
            .then(response => response.json())
            .then(words => {
                // เรียงลำดับคำตามอักษร
                words.sort();
                
                // เพิ่มตัวเลือกลงในรายการเลือกคำ
                wordSelect.innerHTML = '<option value="">-- กรุณาเลือกคำ --</option>';
                words.forEach(word => {
                    const option = document.createElement('option');
                    option.value = word;
                    option.textContent = word;
                    wordSelect.appendChild(option);
                });
                
                updateStatus("โหลดรายการคำเสร็จสิ้น กรุณาเลือกคำ");
            })
            .catch(error => {
                console.error('Error loading words:', error);
                updateStatus("เกิดข้อผิดพลาดในการโหลดรายการคำ");
            });
    }
    
    // ฟังก์ชันสำหรับโหลดข้อมูลของคำที่เลือก
    function loadWordData(word) {
        updateStatus(`กำลังโหลดข้อมูลคำ '${word}'...`);
        
        fetch(`/word/${word}`)
            .then(response => response.json())
            .then(data => {
                wordData = data;
                
                // อัปเดตข้อมูลคำ
                updateWordInfo();
                
                // อัปเดตรายการเลือกวิดีโอ
                updateVideoSelect();
                
                updateStatus(`โหลดข้อมูลคำ '${word}' เสร็จสิ้น กรุณาเลือกวิดีโอ`);
            })
            .catch(error => {
                console.error(`Error loading word data for ${word}:`, error);
                updateStatus(`เกิดข้อผิดพลาดในการโหลดข้อมูลคำ '${word}'`);
            });
    }
    
    // ฟังก์ชันสำหรับโหลดข้อมูลที่แปลงแล้วของวิดีโอที่เลือก
    function loadProcessedData(word, videoIdx) {
        updateStatus(`กำลังโหลดข้อมูลที่แปลงแล้วของวิดีโอ ${videoIdx + 1}...`);
        
        fetch(`/processed/${word}/${videoIdx}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Processed data loaded:', data);
                
                if (!Array.isArray(data) || data.length === 0) {
                    updateStatus('ไม่พบข้อมูลที่แปลงแล้ว หรือข้อมูลไม่ถูกต้อง');
                    return;
                }
                
                processedData = data;
                currentFrameIndex = 0;
                
                // ตรวจสอบโครงสร้างข้อมูล
                console.log('First frame sample:', processedData[0]);
                
                // อัปเดตข้อมูลเฟรม
                updateFrameInfo();
                
                // ทดสอบแสดงเฟรมแรกทันที
                updateAvatar();
                
                // เปิดใช้งานปุ่มควบคุม
                playButton.disabled = false;
                resetButton.disabled = false;
                
                updateStatus(`โหลดข้อมูลที่แปลงแล้วเสร็จสิ้น พร้อมสำหรับการแสดงผล`);
            })
            .catch(error => {
                console.error(`Error loading processed data for ${word} video ${videoIdx}:`, error);
                updateStatus(`เกิดข้อผิดพลาดในการโหลดข้อมูลที่แปลงแล้ว: ${error.message}`);
            });
    }
    
    // ฟังก์ชันสำหรับอัปเดตข้อมูลคำ
    function updateWordInfo() {
        if (!wordData) {
            wordInfo.innerHTML = '<p>กรุณาเลือกคำภาษามือจากรายการด้านบน</p>';
            return;
        }
        
        const word = wordSelect.value;
        const videoCount = wordData.length;
        const totalFrames = wordData.reduce((sum, video) => sum + video.frame_count, 0);
        
        wordInfo.innerHTML = `
            <p><strong>คำ:</strong> ${word}</p>
            <p><strong>จำนวนวิดีโอ:</strong> ${videoCount}</p>
            <p><strong>จำนวนเฟรมทั้งหมด:</strong> ${totalFrames}</p>
        `;
    }
    
    // ฟังก์ชันสำหรับอัปเดตรายการเลือกวิดีโอ
    function updateVideoSelect() {
        if (!wordData) {
            videoSelect.innerHTML = '<option value="">-- กรุณาเลือกวิดีโอ --</option>';
            videoSelect.disabled = true;
            return;
        }
        
        videoSelect.innerHTML = '<option value="">-- กรุณาเลือกวิดีโอ --</option>';
        wordData.forEach((video, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `วิดีโอ ${index + 1}: ${video.file_name} (${video.frame_count} เฟรม)`;
            videoSelect.appendChild(option);
        });
        
        videoSelect.disabled = false;
    }
    
    // ฟังก์ชันสำหรับอัปเดตข้อมูลเฟรม
    function updateFrameInfo() {
        if (!processedData) {
            frameInfo.innerHTML = '<p>เฟรม: 0/0</p>';
            return;
        }
        
        frameInfo.innerHTML = `
            <p><strong>เฟรม:</strong> ${currentFrameIndex + 1}/${processedData.length}</p>
            <p><strong>ความเร็ว:</strong> ${animationSpeed.toFixed(1)}x</p>
        `;
    }
    
    // ฟังก์ชันสำหรับอัปเดตสถานะ
    function updateStatus(message) {
        status.innerHTML = `<p>${message}</p>`;
        console.log(message);
    }
    
    // ฟังก์ชันสำหรับเล่นแอนิเมชัน
    function playAnimation() {
        if (!processedData) return;
        
        isPlaying = true;
        playButton.disabled = true;
        pauseButton.disabled = false;
        updateStatus("กำลังเล่นแอนิเมชัน...");
    }
    
    // ฟังก์ชันสำหรับหยุดแอนิเมชัน
    function pauseAnimation() {
        isPlaying = false;
        playButton.disabled = false;
        pauseButton.disabled = true;
        updateStatus("หยุดแอนิเมชันชั่วคราว");
    }
    
    // ฟังก์ชันสำหรับรีเซ็ตแอนิเมชัน
    function resetAnimation() {
        isPlaying = false;
        currentFrameIndex = 0;
        playButton.disabled = false;
        pauseButton.disabled = true;
        updateFrameInfo();
        updateAvatar();
        updateStatus("รีเซ็ตแอนิเมชันเรียบร้อย");
    }
    
    // ฟังก์ชันสำหรับกำหนดความเร็วแอนิเมชัน
    function setSpeed(value) {
        animationSpeed = parseFloat(value);
        speedValue.textContent = `${animationSpeed.toFixed(1)}x`;
        updateFrameInfo();
    }
    
    // ฟังก์ชันสำหรับเลือกโมเดล
    function selectModel(type, path = null) {
        modelType = type;
        customModelPath = path;
        
        // สร้างโมเดลใหม่
        createModel();
        
        // รีเซ็ตแอนิเมชัน
        if (processedData) {
            resetAnimation();
        }
    }
    
    // ฟังก์ชันสำหรับตั้งค่าการตอบสนองต่อเหตุการณ์
    function initEventListeners() {
        // การเลือกคำ
        wordSelect.addEventListener('change', function() {
            const word = this.value;
            if (!word) return;
            
            // รีเซ็ตข้อมูล
            processedData = null;
            currentFrameIndex = 0;
            isPlaying = false;
            
            // ปิดใช้งานปุ่มควบคุม
            playButton.disabled = true;
            pauseButton.disabled = true;
            resetButton.disabled = true;
            
            // โหลดข้อมูลคำ
            loadWordData(word);
        });
        
        // การเลือกวิดีโอ
        videoSelect.addEventListener('change', function() {
            const videoIdx = parseInt(this.value);
            if (isNaN(videoIdx)) return;
            
            // รีเซ็ตข้อมูล
            processedData = null;
            currentFrameIndex = 0;
            isPlaying = false;
            
            // ปิดใช้งานปุ่มควบคุม
            playButton.disabled = true;
            pauseButton.disabled = true;
            resetButton.disabled = true;
            
            // โหลดข้อมูลที่แปลงแล้ว
            loadProcessedData(wordSelect.value, videoIdx);
        });
        
        // การกดปุ่มเล่น
        playButton.addEventListener('click', playAnimation);
        
        // การกดปุ่มหยุด
        pauseButton.addEventListener('click', pauseAnimation);
        
        // การกดปุ่มรีเซ็ต
        resetButton.addEventListener('click', resetAnimation);
        
        // การปรับความเร็ว
        speedRange.addEventListener('input', function() {
            setSpeed(this.value);
        });
        
        // การเลือกโมเดล
        modelSelect.addEventListener('change', function() {
            const type = this.value;
            
            if (type === 'custom') {
                // ถ้าเลือกโมเดลสำเร็จรูป ให้เปิดหน้าต่างเลือกไฟล์
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.glb,.gltf';
                input.onchange = function() {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            // สร้าง URL สำหรับไฟล์
                            const modelUrl = URL.createObjectURL(file);
                            
                            // เลือกโมเดลใหม่
                            selectModel('custom', modelUrl);
                            
                            updateStatus(`โหลดโมเดล '${file.name}' เรียบร้อยแล้ว`);
                        };
                        
                        reader.readAsArrayBuffer(file);
                    }
                };
                
                input.click();
            } else {
                // เลือกโมเดลแบบง่าย
                selectModel('simple');
                updateStatus("เลือกโมเดลแบบง่ายเรียบร้อยแล้ว");
            }
        });
    }
    
    // เริ่มต้นแอปพลิเคชัน
    init();
});