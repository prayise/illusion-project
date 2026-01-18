let video;
let pixelSize = 10;
let canvas;
let isInitialized = false;

// Camera & Interaction Variables
let camX = 0, camY = 0, camZ = 0;
let targetCamX = 0, targetCamY = 0, targetCamZ = 0;

// Falling Sand Mode Variables
let particles = [];
let prevPixels = null;
const MAX_PARTICLES = 3000;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    camZ = (height / 2.0) / tan(PI * 30.0 / 180.0);
    targetCamZ = camZ;

    // UI Setup
    const startBtn = document.getElementById('startButton');
    startBtn.addEventListener('click', () => {
        startBtn.innerText = "CONNECTING...";
        initCamera();
    });

    const dlBtn = document.getElementById('downloadButton');
    dlBtn.addEventListener('click', () => {
        saveCanvas('illusion_snapshot', 'png');
    });

    // Guide Modal Interactions
    const guideBtn = document.getElementById('guideButton');
    const guideModal = document.getElementById('guideModal');
    const closeBtn = document.querySelector('.close-modal');

    if (guideBtn && guideModal) {
        guideBtn.addEventListener('click', () => {
            guideModal.classList.add('visible');
        });

        closeBtn.addEventListener('click', () => {
            guideModal.classList.remove('visible');
        });

        window.addEventListener('click', (e) => {
            if (e.target === guideModal) {
                guideModal.classList.remove('visible');
            }
        });
    }
}

function initCamera() {
    console.log("Attempting to initialize camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not available! Ensure HTTPS or localhost.");
        return;
    }

    let constraints = { video: true, audio: false };

    video = createCapture(constraints, function (stream) {
        console.log("Camera access GRANTED");
        isInitialized = true;
        document.getElementById('startButton').innerText = "LINK ESTABLISHED";
        setTimeout(() => {
            document.getElementById('overlay').classList.add('hidden');
            document.getElementById('ui-controls').style.display = 'flex';
        }, 500);
    });

    video.size(160, 120);
    video.hide();
}

function draw() {
    background(0);

    if (!isInitialized || !video || video.width === 0) {
        return;
    }

    // Camera Control
    const rotVal = document.getElementById('rotSlider').value;
    const tiltVal = document.getElementById('tiltSlider').value;
    targetCamX = parseFloat(rotVal);
    targetCamY = parseFloat(tiltVal);
    camX = lerp(camX, targetCamX, 0.1);
    camY = lerp(camY, targetCamY, 0.1);

    camera(camX, camY - 100, camZ + 300, 0, 0, 0, 0, 1, 0);

    // Lighting
    ambientLight(40);
    pointLight(255, 255, 255, camX, camY, 300);
    directionalLight(50, 50, 100, 1, 0, -0.5);

    video.loadPixels();

    let vw = video.width;
    let vh = video.height;

    // Get Mode
    const mode = document.getElementById('modeSelector').value;

    switch (mode) {
        case "FIBER":
            renderFiberOptic(vw, vh);
            break;
        case "MATRIX":
            renderMatrixRain(vw, vh);
            break;
        case "SAND":
            renderFallingSand(vw, vh);
            break;
        default:
            renderFiberOptic(vw, vh);
    }
}

// ==========================================
// MODE 1: FIBER OPTIC (Default)
// ==========================================
function renderFiberOptic(vw, vh) {
    let spacing = 5;
    let fiberWidth = 1.8;
    let startX = -(vw * spacing) / 2;
    let startY = -(vh * spacing) / 2;

    noStroke();

    for (let y = 0; y < vh; y++) {
        for (let x = 0; x < vw; x++) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let r = video.pixels[idx];
            let g = video.pixels[idx + 1];
            let b = video.pixels[idx + 2];
            let bright = (r + g + b) / 3;
            if (bright < 20) continue;

            let zHeight = map(bright / 255.0, 0, 1, 10, 200);

            push();
            translate(startX + x * spacing, startY + y * spacing, 0);

            specularMaterial(30);
            shininess(50);
            fill(r * 0.1, g * 0.1, b * 0.1);
            translate(0, 0, zHeight / 2);
            box(fiberWidth, fiberWidth, zHeight);

            translate(0, 0, zHeight / 2 + 0.5);
            emissiveMaterial(r, g, b);
            box(fiberWidth, fiberWidth, 2);
            pop();
        }
    }
}

// ==========================================
// MODE 2: MATRIX RAIN
// ==========================================
function renderMatrixRain(vw, vh) {
    let spacing = 5;
    let boxSize = 2;
    let startX = -(vw * spacing) / 2;
    let startY = -(vh * spacing) / 2;

    noStroke();

    for (let y = 0; y < vh; y++) {
        for (let x = 0; x < vw; x++) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let bright = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;
            if (bright < 15) continue;

            let zHeight = map(bright, 0, 255, 10, 250);
            let noiseVal = noise(x * 0.1, y * 0.1 - frameCount * 0.05);

            push();
            translate(startX + x * spacing, startY + y * spacing, 0);

            let isHighlight = noiseVal > 0.6;

            specularMaterial(0, 30, 0);
            shininess(100);
            translate(0, 0, zHeight / 2);
            box(boxSize, boxSize, zHeight);

            translate(0, 0, zHeight / 2 + 1);
            if (isHighlight) {
                emissiveMaterial(200, 255, 200);
            } else {
                emissiveMaterial(0, 150, 50);
            }
            box(boxSize, boxSize, 2);
            pop();
        }
    }
}

// ==========================================
// MODE 3: FALLING SAND
// Motion-detected particles with physics
// ==========================================
function renderFallingSand(vw, vh) {
    let spacing = 5;
    let startX = -(vw * spacing) / 2;
    let startY = -(vh * spacing) / 2;

    // Motion Detection: Compare with previous frame
    if (prevPixels) {
        for (let y = 0; y < vh; y += 2) {
            for (let x = 0; x < vw; x += 2) {
                let idx = (y * vw + (vw - 1 - x)) * 4;

                let r = video.pixels[idx];
                let g = video.pixels[idx + 1];
                let b = video.pixels[idx + 2];
                let prevR = prevPixels[idx];
                let prevG = prevPixels[idx + 1];
                let prevB = prevPixels[idx + 2];

                let diff = abs(r - prevR) + abs(g - prevG) + abs(b - prevB);

                // Motion threshold
                if (diff > 60 && particles.length < MAX_PARTICLES) {
                    particles.push({
                        x: startX + x * spacing,
                        y: startY + y * spacing,
                        z: random(50, 150),
                        vz: random(-2, -0.5),
                        r: r,
                        g: g,
                        b: b,
                        life: 255,
                        size: random(2, 4)
                    });
                }
            }
        }
    }

    // Store current frame for next comparison
    prevPixels = video.pixels.slice();

    // Render static silhouette (dim)
    noStroke();
    for (let y = 0; y < vh; y += 2) {
        for (let x = 0; x < vw; x += 2) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let r = video.pixels[idx];
            let g = video.pixels[idx + 1];
            let b = video.pixels[idx + 2];
            let bright = (r + g + b) / 3;
            if (bright < 30) continue;

            push();
            translate(startX + x * spacing, startY + y * spacing, 10);
            fill(r * 0.3, g * 0.3, b * 0.3, 150);
            box(4, 4, 10);
            pop();
        }
    }

    // Update and render particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        // Gravity
        p.vz -= 0.15;
        p.z += p.vz;
        p.life -= 3;

        // Remove dead particles
        if (p.z < -100 || p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        // Draw particle with glow
        push();
        translate(p.x, p.y, p.z);

        // Glow effect using emissive material
        let alpha = p.life / 255;
        emissiveMaterial(p.r * alpha, p.g * alpha, p.b * alpha);
        noStroke();
        sphere(p.size);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
