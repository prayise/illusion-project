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

// Matrix Modes Variables
let matrixCanvas;
let matrixStreams = [];
let matrixInitialized = false;
let timeFrozen = false;
let shockwaves = [];
let ghostTrails = []; // For System Failure mode artifacts
let userCenterX = 0, userCenterY = 0; // For The One repulsion

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
        case "CODE":
            renderMatrixCode(vw, vh);
            break;
        case "ONE":
            renderMatrixOne(vw, vh);
            break;
        case "FAILURE":
            renderMatrixFailure(vw, vh);
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

// ==========================================
// MATRIX VISUAL MODES (The Code, The One, System Failure)
// ==========================================

const SYMBOL_SIZE = 14;
const KATAKANA_START = 0x30A0;

class MatrixChar {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.value = this.randomChar();
        this.switchInterval = floor(random(5, 20));
    }

    randomChar() {
        if (random() > 0.4) {
            return String.fromCharCode(KATAKANA_START + floor(random(96)));
        }
        return random() > 0.5 ?
            String.fromCharCode(0x30 + floor(random(10))) :
            String.fromCharCode(0x41 + floor(random(26)));
    }

    update() {
        if (frameCount % this.switchInterval === 0) {
            this.value = this.randomChar();
        }
    }
}

class MatrixStreamObj {
    constructor(x, mode) {
        this.x = x;
        this.y = random(-500, 0);
        this.speed = random(3, 8);
        this.chars = [];
        this.length = floor(random(10, 30));
        this.mode = mode;
        this.direction = 1; // 1 = down, -1 = up
        this.horizontal = false;

        for (let i = 0; i < this.length; i++) {
            this.chars.push(new MatrixChar(x, this.y - i * SYMBOL_SIZE, this.speed));
        }
    }

    update() {
        if (!timeFrozen) {
            if (this.horizontal) {
                this.x += this.speed * this.direction;
                if (this.x > width + 100 || this.x < -100) {
                    this.x = this.direction > 0 ? -50 : width + 50;
                }
            } else {
                this.y += this.speed * this.direction;
                if (this.y - this.length * SYMBOL_SIZE > height || this.y < -500) {
                    this.y = this.direction > 0 ? random(-200, 0) : height + 200;
                }
            }
        }

        for (let i = 0; i < this.chars.length; i++) {
            let c = this.chars[i];
            if (this.horizontal) {
                c.x = this.x - i * SYMBOL_SIZE * this.direction;
                c.y = this.y;
            } else {
                c.y = this.y - i * SYMBOL_SIZE * this.direction;
            }
            c.update();
        }
    }
}

function initMatrixMode() {
    matrixCanvas = createGraphics(windowWidth, windowHeight);
    matrixCanvas.textFont('monospace');
    matrixCanvas.textSize(SYMBOL_SIZE);
    matrixCanvas.textAlign(LEFT, TOP);

    matrixStreams = [];
    let cols = ceil(width / SYMBOL_SIZE);
    for (let i = 0; i < cols; i++) {
        matrixStreams.push(new MatrixStreamObj(i * SYMBOL_SIZE, 'CODE'));
    }
    matrixInitialized = true;
}

// MODE A: THE CODE (Classic) - Text-only, Density Mapping, Hyper-Activity
function renderMatrixCode(vw, vh) {
    if (!matrixInitialized) initMatrixMode();

    matrixCanvas.clear();
    matrixCanvas.background(0, 25);

    let scaleX = vw / width;
    let scaleY = vh / height;

    // First pass: Render background streams (slow, sparse)
    for (let stream of matrixStreams) {
        stream.update();

        for (let i = 0; i < stream.chars.length; i++) {
            let c = stream.chars[i];
            if (c.y < 0 || c.y > height) continue;

            // Check if this position overlaps with user
            let vidX = floor(constrain(vw - c.x * scaleX, 0, vw - 1));
            let vidY = floor(constrain(c.y * scaleY, 0, vh - 1));
            let idx = (vidY * vw + vidX) * 4;
            let bright = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;

            let isUser = bright > 50;
            let isHead = (i === 0);

            if (isUser) {
                // USER AREA: Dense text, bright colors, hyper-activity
                // Hyper-activity: change character every few frames
                if (frameCount % 3 === 0) {
                    c.value = c.randomChar();
                }

                // Density based on brightness
                let density = map(bright, 50, 255, 0.5, 1.0);
                if (random() > density) continue;

                // Bright user colors: light green to white
                let userAlpha = map(bright, 50, 255, 150, 255);
                if (bright > 180) {
                    // Very bright = white highlight
                    matrixCanvas.fill(255, 255, 255, userAlpha);
                } else {
                    // Normal bright = light green (#50FF50)
                    matrixCanvas.fill(80, 255, 80, userAlpha);
                }
                matrixCanvas.text(c.value, c.x, c.y);
            } else {
                // BACKGROUND: Sparse, dim, standard green
                if (random() > 0.4) continue; // Very sparse

                let alpha = isHead ? 180 : map(i, 0, stream.length, 120, 20);
                matrixCanvas.fill(0, 255, 65, alpha);
                matrixCanvas.text(c.value, c.x, c.y);
            }
        }
    }

    // Draw to WEBGL
    push();
    resetMatrix();
    translate(-width / 2, -height / 2, 0);
    noLights();
    image(matrixCanvas, 0, 0);
    pop();
    perspective();
}

// MODE B: THE ONE (Awakening) - Golden Glow, Repulsion, Solid Light Form
function renderMatrixOne(vw, vh) {
    if (!matrixInitialized) initMatrixMode();

    matrixCanvas.clear();
    matrixCanvas.background(0, 40);

    let scaleX = vw / width;
    let scaleY = vh / height;

    // Calculate user center for repulsion
    let sumX = 0, sumY = 0, count = 0;
    for (let y = 0; y < vh; y += 4) {
        for (let x = 0; x < vw; x += 4) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let bright = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;
            if (bright > 60) {
                sumX += x * (width / vw);
                sumY += y * (height / vh);
                count++;
            }
        }
    }
    if (count > 0) {
        userCenterX = lerp(userCenterX, sumX / count, 0.1);
        userCenterY = lerp(userCenterY, sumY / count, 0.1);
    }

    // Update shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].radius += 8;
        shockwaves[i].alpha -= 4;
        if (shockwaves[i].alpha <= 0) shockwaves.splice(i, 1);
    }

    // Background rain with repulsion effect
    for (let stream of matrixStreams) {
        stream.update();

        for (let i = 0; i < stream.chars.length; i++) {
            let c = stream.chars[i];
            if (c.y < 0 || c.y > height) continue;

            // Repulsion: push code away from user center
            let dx = c.x - userCenterX;
            let dy = c.y - userCenterY;
            let distToUser = sqrt(dx * dx + dy * dy);
            let repulsionRadius = 250;

            let renderX = c.x;
            let renderY = c.y;

            if (distToUser < repulsionRadius) {
                // Physical push: shift render position away from center
                let force = map(distToUser, 0, repulsionRadius, 1.2, 0);
                renderX += dx * force * 0.6;
                renderY += dy * force * 0.6;

                // Code near user is blurred and very dim
                let alpha = map(distToUser, 0, repulsionRadius, 2, 25);
                matrixCanvas.fill(0, 60, 30, alpha);
            } else {
                // Normal dim background
                let alpha = map(i, 0, stream.length, 40, 10);
                matrixCanvas.fill(0, 80, 40, alpha);
            }
            matrixCanvas.text(c.value, renderX, renderY);
        }
    }

    // User: Solid golden/white glow with ADD-like blending
    matrixCanvas.blendMode(ADD);

    for (let y = 0; y < vh; y += 2) {
        for (let x = 0; x < vw; x += 2) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let bright = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;

            if (bright > 40) {
                let px = x * (width / vw);
                let py = y * (height / vh);

                // Solid glow: golden core with white highlight
                let coreSize = map(bright, 40, 255, 3, 10);
                let intensity = map(bright, 40, 255, 50, 200);

                // Golden aura
                matrixCanvas.noStroke();
                matrixCanvas.fill(255, 200, 100, intensity * 0.5);
                matrixCanvas.circle(px, py, coreSize * 2);

                // White core
                matrixCanvas.fill(255, 255, 230, intensity);
                matrixCanvas.circle(px, py, coreSize);

                // Generate shockwave on strong motion
                if (prevPixels && random() > 0.995) {
                    let prevBright = (prevPixels[idx] + prevPixels[idx + 1] + prevPixels[idx + 2]) / 3;
                    if (abs(bright - prevBright) > 40) {
                        shockwaves.push({ x: px, y: py, radius: 20, alpha: 200 });
                    }
                }
            }
        }
    }

    matrixCanvas.blendMode(BLEND);

    // Draw expanding shockwaves
    matrixCanvas.noFill();
    for (let sw of shockwaves) {
        // Golden shockwave
        matrixCanvas.stroke(255, 220, 150, sw.alpha);
        matrixCanvas.strokeWeight(3);
        matrixCanvas.circle(sw.x, sw.y, sw.radius * 2);

        // Secondary ring
        matrixCanvas.stroke(255, 255, 200, sw.alpha * 0.5);
        matrixCanvas.strokeWeight(1);
        matrixCanvas.circle(sw.x, sw.y, sw.radius * 2.5);
    }

    // Draw to WEBGL
    push();
    resetMatrix();
    translate(-width / 2, -height / 2, 0);
    noLights();
    image(matrixCanvas, 0, 0);
    pop();
    perspective();
}

// MODE C: SYSTEM FAILURE (Glitch) - Slice/Shift, Broken Unicode, Ghost Trails
function renderMatrixFailure(vw, vh) {
    if (!matrixInitialized) initMatrixMode();

    // Intermittent blink effect
    if (random() > 0.98) {
        matrixCanvas.background(0);
        push();
        resetMatrix();
        translate(-width / 2, -height / 2, 0);
        noLights();
        image(matrixCanvas, 0, 0);
        pop();
        perspective();
        return; // Screen blink - skip frame
    }

    matrixCanvas.clear();
    matrixCanvas.background(20, 0, 0, 30); // Red tinted background

    let scaleX = vw / width;
    let scaleY = vh / height;

    // Chaos: randomize stream directions more frequently
    if (frameCount % 30 === 0) {
        for (let stream of matrixStreams) {
            if (random() > 0.6) {
                stream.direction = random() > 0.5 ? 1 : -1;
                stream.horizontal = random() > 0.5;
                stream.y = random(-100, height);
            }
        }
    }

    // Broken unicode characters
    const brokenChars = ['■', '□', '▓', '▒', '░', '█', '▄', '▀', '◼', '◻', '▪', '▫', '⬛', '⬜', '◾', '◽'];

    // Render chaotic streams with broken characters
    for (let stream of matrixStreams) {
        stream.update();

        for (let i = 0; i < stream.chars.length; i++) {
            let c = stream.chars[i];
            if (c.y < 0 || c.y > height || c.x < 0 || c.x > width) continue;

            let isHead = (i === 0);
            let alpha = isHead ? 255 : map(i, 0, stream.length, 200, 40);

            // Mostly red, some green and purple
            let colorChoice = random();
            if (colorChoice < 0.6) matrixCanvas.fill(255, 0, 50, alpha);
            else if (colorChoice < 0.8) matrixCanvas.fill(0, 200, 50, alpha);
            else matrixCanvas.fill(180, 0, 255, alpha);

            // Sometimes use broken characters
            let charToRender = (random() > 0.85) ? brokenChars[floor(random(brokenChars.length))] : c.value;
            matrixCanvas.text(charToRender, c.x, c.y);
        }
    }

    // Update ghost trails (persistent artifacts)
    for (let i = ghostTrails.length - 1; i >= 0; i--) {
        ghostTrails[i].alpha -= 2;
        ghostTrails[i].y += random(-1, 2); // Slight drift
        if (ghostTrails[i].alpha <= 0) ghostTrails.splice(i, 1);
    }

    // Limit ghost trails
    while (ghostTrails.length > 500) {
        ghostTrails.shift();
    }

    // Draw ghost trails (red artifacts)
    for (let gt of ghostTrails) {
        matrixCanvas.noStroke();
        matrixCanvas.fill(255, 0, 50, gt.alpha);
        matrixCanvas.rect(gt.x, gt.y, 4, 4);
    }

    // User with SLICE/SHIFT glitch, Broken Unicode, and strong chromatic aberration
    let sliceOffset = floor(random(-30, 30)); // Horizontal slice shift
    let sliceY = floor(random(height * 0.2, height * 0.8)); // Where slice occurs
    let sliceHeight = floor(random(30, 100));

    for (let y = 0; y < vh; y += 3) {
        for (let x = 0; x < vw; x += 3) {
            let idx = (y * vw + (vw - 1 - x)) * 4;
            let bright = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;

            if (bright > 30) {
                let px = x * (width / vw);
                let py = y * (height / vh);

                // SLICE/SHIFT
                if (py > sliceY && py < sliceY + sliceHeight) {
                    px += sliceOffset;
                }

                // Strong RGB chromatic aberration offset
                let offset = map(bright, 30, 255, 6, 18);

                // Data Corruption: use special characters for user
                let userChar = (random() > 0.4) ? brokenChars[floor(random(brokenChars.length))] : '?';

                matrixCanvas.textSize(12);
                matrixCanvas.noStroke();

                // Red channel
                matrixCanvas.fill(255, 0, 0, 120);
                matrixCanvas.text(userChar, px - offset, py);

                // Cyan channel
                matrixCanvas.fill(0, 255, 255, 100);
                matrixCanvas.text(userChar, px + offset, py);

                // Add ghost trail on motion
                if (prevPixels && random() > 0.96) {
                    let prevBright = (prevPixels[idx] + prevPixels[idx + 1] + prevPixels[idx + 2]) / 3;
                    if (abs(bright - prevBright) > 15) {
                        ghostTrails.push({ x: px, y: py, alpha: 180 });
                    }
                }
            }
        }
    }
    matrixCanvas.textSize(SYMBOL_SIZE);

    // Periodic noise/distortion lines
    if (random() > 0.9) {
        matrixCanvas.stroke(255, 0, 80, 200);
        matrixCanvas.strokeWeight(random(2, 5));
        for (let i = 0; i < floor(random(3, 10)); i++) {
            let yPos = random(height);
            let xStart = random(width * 0.3);
            let xEnd = xStart + random(width * 0.3, width * 0.7);
            matrixCanvas.line(xStart, yPos, xEnd, yPos);
        }
    }

    // Occasional "SYSTEM ERROR" text
    if (random() > 0.97 && frameCount % 5 < 3) {
        matrixCanvas.fill(255, 0, 50);
        matrixCanvas.textSize(32);
        matrixCanvas.textAlign(CENTER, CENTER);
        let errorMsgs = ['SYSTEM ERROR', 'DATA CORRUPTION', 'SIGNAL LOST', 'VIRUS DETECTED', 'MEMORY FAULT'];
        matrixCanvas.text(errorMsgs[floor(random(errorMsgs.length))], width / 2 + random(-50, 50), height / 2 + random(-100, 100));
        matrixCanvas.textSize(SYMBOL_SIZE);
        matrixCanvas.textAlign(LEFT, TOP);
    }

    // Draw to WEBGL
    push();
    resetMatrix();
    translate(-width / 2, -height / 2, 0);
    noLights();
    image(matrixCanvas, 0, 0);
    pop();
    perspective();
}

// Keyboard controls for mode switching
function keyPressed() {
    if (key === '1') {
        document.getElementById('modeSelector').value = 'CODE';
    } else if (key === '2') {
        document.getElementById('modeSelector').value = 'ONE';
    } else if (key === '3') {
        document.getElementById('modeSelector').value = 'FAILURE';
    }
}

// Time Freeze: mouse hold
function mousePressed() {
    timeFrozen = true;
}

function mouseReleased() {
    timeFrozen = false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

