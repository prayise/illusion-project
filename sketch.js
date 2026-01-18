let video;
let pixelSize = 10;
let canvas;
let isInitialized = false;

// Camera & Interaction Variables
let camX = 0, camY = 0, camZ = 0;
let targetCamX = 0, targetCamY = 0, targetCamZ = 0;

function setup() {
    // Switch to WEBGL mode
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    // Default camera position - Tilted for "Floor" view
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
}

function initCamera() {
    console.log("Attempting to initialize camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not available! Ensure HTTPS or localhost.");
        return;
    }

    let constraints = {
        video: true,
        audio: false
    };

    video = createCapture(constraints, function (stream) {
        console.log("Camera access GRANTED");
        isInitialized = true;
        document.getElementById('startButton').innerText = "LINK ESTABLISHED";
        setTimeout(() => {
            document.getElementById('overlay').classList.add('hidden');
        }, 500);
    });

    video.size(160, 120); // 160x120 = 19,200 fibers
    video.hide();
}

function draw() {
    background(0); // Black void

    if (!isInitialized || !video || !video.loadedmetadata) {
        return;
    }

    // 1. Camera Smoothing & Angle
    let mX = (mouseX - width / 2);
    let mY = (mouseY - height / 2);

    // User wants "See face in 3D" -> We need more side profile capability
    // Map mouseX to rotation (Azimuth), mouseY to elevation (Altitude)
    targetCamX = mX * 1.5; // Wider rotation range to see side profile
    targetCamY = mY * 1.5; // Wider tilt range

    camX = lerp(camX, targetCamX, 0.05);
    camY = lerp(camY, targetCamY, 0.05);

    // Camera Position: Rotate around center
    // Orbit Control logic simulation
    // We look at (0,0,0) from (camX, camY, distance)

    camera(camX, camY - 100, camZ + 200,
        0, 0, 0, // Look at Center of "Face" (not floor)
        0, 1, 0);

    // 2. Lighting - Enhanced for Visibility
    ambientLight(40); // Brighter base
    // Key Light
    pointLight(0, 0, 100, camX, camY, 300); // White light from viewer
    // Fill Light (Warm)
    directionalLight(50, 0, 100, 1, 0, -0.5);

    // 3. 3D Pillar Loading
    video.loadPixels();

    let vw = video.width;
    let vh = video.height;

    // FIBER OPTIC SETTINGS
    // High Density but Thin Strands
    let spacing = 5;
    let fiberWidth = 1.8; // Thin strands relative to spacing

    let totalW = vw * spacing;
    let totalH = vh * spacing;

    let startX = -totalW / 2;
    let startY = -totalH / 2;

    // No Stroke for clean fiber look
    noStroke();

    for (let y = 0; y < vh; y++) {
        for (let x = 0; x < vw; x++) {

            let mirroredX = vw - 1 - x;
            let idx = (y * vw + mirroredX) * 4;

            let r = video.pixels[idx];
            let g = video.pixels[idx + 1];
            let b = video.pixels[idx + 2];
            let bright = (r + g + b) / 3;

            // Optimization
            if (bright < 20) continue;

            // FIBER OPTIC LOOK
            // 1. Dark, semi-transparent shaft
            // 2. Bright glowing tip

            let zNorm = bright / 255.0;
            let zHeight = map(zNorm, 0, 1, 10, 200);

            let px = startX + x * spacing;
            let py = startY + y * spacing;

            push();
            translate(px, py, 0);

            // Draw Shaft (The Fiber Body)
            // Dark gray, reflective but not emitting light
            specularMaterial(30);
            shininess(50); // Glossy plastic
            // fill(20); // Dark body

            // Allow slight color tint on shaft but keep it dark?
            // "Optical fiber" sides are usually just cladding.
            fill(r * 0.1, g * 0.1, b * 0.1);

            translate(0, 0, zHeight / 2);
            box(fiberWidth, fiberWidth, zHeight);

            // Draw Tip (The Light Source)
            // Emissive bright cap
            translate(0, 0, zHeight / 2 + 0.5); // Accound for half-height + tiny gap

            emissiveMaterial(r, g, b); // Full brightness color
            // Small cap
            box(fiberWidth, fiberWidth, 2);

            pop();
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
