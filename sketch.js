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

// Cyberpunk Mode Variables
let faceApi;
let detections = [];
let prevPixelSum = 0;
let glitchActive = false;
let glitchTimer = 0;
let cyberCanvas;

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
        case "CYBER":
            renderCyberpunk(vw, vh);
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

// ==========================================
// MODE 4: CYBERPUNK HUD
// Neon color grading, chromatic aberration, face HUD
// ==========================================
function initCyberpunk() {
    console.log('Initializing Cyberpunk Mode...');
    cyberCanvas = createGraphics(windowWidth, windowHeight);
    cyberCanvas.textFont('monospace');

    // Initialize face detection with error handling
    try {
        if (typeof ml5 !== 'undefined' && ml5.faceApi) {
            faceApi = ml5.faceApi(video, { withLandmarks: true, withDescriptors: false }, () => {
                console.log('Face API Ready');
                faceApi.detect(gotFaces);
            });
        } else {
            console.warn('ml5.js faceApi not available');
        }
    } catch (e) {
        console.error('Face API init error:', e);
    }
}

function gotFaces(error, result) {
    if (error) {
        console.error('Face detection error:', error);
        return;
    }
    detections = result || [];
    if (faceApi) {
        setTimeout(() => faceApi.detect(gotFaces), 100); // Throttle
    }
}

function renderCyberpunk(vw, vh) {
    try {
        if (!cyberCanvas) initCyberpunk();

        cyberCanvas.clear();

        // Motion detection for glitch trigger
        let pixelSum = 0;
        for (let i = 0; i < video.pixels.length; i += 40) {
            pixelSum += video.pixels[i];
        }
        let motionDelta = abs(pixelSum - prevPixelSum);
        prevPixelSum = pixelSum;

        // Trigger glitch on rapid motion
        if (motionDelta > 50000) {
            glitchActive = true;
            glitchTimer = 30; // frames
        }

        if (glitchTimer > 0) {
            glitchTimer--;
        } else {
            glitchActive = false;
        }

        // === RENDER TO 2D CANVAS ===

        // 1. Color Grading + Chromatic Aberration
        let scale = min(windowWidth / vw, windowHeight / vh);
        let offsetX = (windowWidth - vw * scale) / 2;
        let offsetY = (windowHeight - vh * scale) / 2;

        cyberCanvas.noStroke();

        for (let y = 0; y < vh; y += 2) {
            for (let x = 0; x < vw; x += 2) {
                let idx = (y * vw + (vw - 1 - x)) * 4;
                let r = video.pixels[idx];
                let g = video.pixels[idx + 1];
                let b = video.pixels[idx + 2];
                let bright = (r + g + b) / 3;

                // Color grading: dark = navy, bright = cyan/magenta
                let mappedR, mappedG, mappedB;
                if (bright < 80) {
                    // Dark: Deep Navy
                    mappedR = map(bright, 0, 80, 10, 30);
                    mappedG = map(bright, 0, 80, 10, 20);
                    mappedB = map(bright, 0, 80, 40, 80);
                } else {
                    // Bright: Neon Cyan/Magenta blend
                    let blend = (x + y + frameCount * 2) % 100 / 100;
                    if (blend > 0.5) {
                        // Cyan
                        mappedR = map(bright, 80, 255, 0, 50);
                        mappedG = map(bright, 80, 255, 200, 255);
                        mappedB = map(bright, 80, 255, 200, 255);
                    } else {
                        // Magenta
                        mappedR = map(bright, 80, 255, 200, 255);
                        mappedG = map(bright, 80, 255, 0, 100);
                        mappedB = map(bright, 80, 255, 200, 255);
                    }
                }

                let px = offsetX + x * scale;
                let py = offsetY + y * scale;
                let sz = scale * 2;

                // Chromatic Aberration: offset RGB channels
                let aberration = glitchActive ? random(3, 8) : 2;

                cyberCanvas.fill(mappedR, 0, 0, 100);
                cyberCanvas.rect(px - aberration, py, sz, sz);

                cyberCanvas.fill(0, mappedG, 0, 100);
                cyberCanvas.rect(px, py, sz, sz);

                cyberCanvas.fill(0, 0, mappedB, 100);
                cyberCanvas.rect(px + aberration, py, sz, sz);
            }
        }

        // 2. Glitch Effect: Slit-scan + SIGNAL LOST
        if (glitchActive) {
            // Slit-scan lines
            cyberCanvas.stroke(255, 0, 100, 150);
            cyberCanvas.strokeWeight(2);
            for (let i = 0; i < 10; i++) {
                let yPos = random(windowHeight);
                cyberCanvas.line(0, yPos, windowWidth, yPos);
            }

            // SIGNAL LOST text
            cyberCanvas.noStroke();
            cyberCanvas.fill(255, 0, 80);
            cyberCanvas.textSize(48);
            cyberCanvas.textAlign(CENTER, CENTER);
            if (frameCount % 10 < 5) {
                cyberCanvas.text('[ SIGNAL LOST ]', windowWidth / 2, windowHeight / 2);
            }
        }

        // 3. Face HUD Overlay
        if (detections.length > 0) {
            for (let det of detections) {
                let box = det.alignedRect._box;
                let fx = offsetX + (vw - box._x - box._width) * scale; // Mirror X
                let fy = offsetY + box._y * scale;
                let fw = box._width * scale;
                let fh = box._height * scale;

                // HUD Frame
                cyberCanvas.noFill();
                cyberCanvas.stroke(0, 255, 200, 200);
                cyberCanvas.strokeWeight(2);
                cyberCanvas.rect(fx, fy, fw, fh);

                // Corner brackets
                let corner = 20;
                cyberCanvas.line(fx, fy, fx + corner, fy);
                cyberCanvas.line(fx, fy, fx, fy + corner);
                cyberCanvas.line(fx + fw, fy, fx + fw - corner, fy);
                cyberCanvas.line(fx + fw, fy, fx + fw, fy + corner);
                cyberCanvas.line(fx, fy + fh, fx + corner, fy + fh);
                cyberCanvas.line(fx, fy + fh, fx, fy + fh - corner);
                cyberCanvas.line(fx + fw, fy + fh, fx + fw - corner, fy + fh);
                cyberCanvas.line(fx + fw, fy + fh, fx + fw, fy + fh - corner);

                // Status text
                cyberCanvas.fill(0, 255, 200);
                cyberCanvas.noStroke();
                cyberCanvas.textSize(12);
                cyberCanvas.textAlign(LEFT, TOP);
                cyberCanvas.text('ID: UNKNOWN', fx, fy - 20);
                cyberCanvas.text('STATUS: SCANNING...', fx, fy + fh + 5);

                // 4. Cybernetic Eye Crosshairs
                if (det.parts && det.parts.leftEye) {
                    let leftEye = det.parts.leftEye[0];
                    let rightEye = det.parts.rightEye[0];

                    let eyeScale = scale;

                    // Left Eye
                    let lex = offsetX + (vw - leftEye._x) * eyeScale;
                    let ley = offsetY + leftEye._y * eyeScale;
                    drawCyberneticEye(cyberCanvas, lex, ley);

                    // Right Eye
                    let rex = offsetX + (vw - rightEye._x) * eyeScale;
                    let rey = offsetY + rightEye._y * eyeScale;
                    drawCyberneticEye(cyberCanvas, rex, rey);
                }
            }
        }

        // Scanlines overlay
        cyberCanvas.stroke(0, 255, 200, 20);
        cyberCanvas.strokeWeight(1);
        for (let i = 0; i < windowHeight; i += 4) {
            cyberCanvas.line(0, i, windowWidth, i);
        }

        // === DRAW TO MAIN WEBGL CANVAS ===
        push();
        resetMatrix();
        translate(-width / 2, -height / 2, 0);
        noLights();
        image(cyberCanvas, 0, 0);
        pop();

        perspective();
    } catch (e) {
        console.error('Cyberpunk render error:', e);
    }
}

function drawCyberneticEye(pg, x, y) {
    let r = 25;

    // Outer glow circle
    pg.noFill();
    pg.stroke(0, 255, 200, 150);
    pg.strokeWeight(2);
    pg.circle(x, y, r * 2);

    // Inner crosshairs
    pg.stroke(255, 0, 100);
    pg.strokeWeight(1);
    pg.line(x - r, y, x + r, y);
    pg.line(x, y - r, x, y + r);

    // Center dot
    pg.fill(255, 0, 100);
    pg.noStroke();
    pg.circle(x, y, 6);

    // Rotating element
    let angle = frameCount * 0.05;
    let rx = x + cos(angle) * r * 0.7;
    let ry = y + sin(angle) * r * 0.7;
    pg.fill(0, 255, 200);
    pg.circle(rx, ry, 4);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
