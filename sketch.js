let video;
let pixelSize = 8; // Smaller for 3D effect (User requested 1/10th, but 2-3px might kill FPS on JS. Starting meaningful small size)
let canvas;
let isInitialized = false;

// Camera & Interaction Variables
let camX = 0, camY = 0, camZ = 0;
let targetCamX = 0, targetCamY = 0, targetCamZ = 0;

function setup() {
    // Switch to WEBGL mode
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    // Default camera position
    camZ = (height / 2.0) / tan(PI * 30.0 / 180.0);
    targetCamZ = camZ;

    // UI Setup
    const startBtn = document.getElementById('startButton');
    startBtn.addEventListener('click', () => {
        startBtn.innerText = "CONNECTING...";
        initCamera();
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

    video.size(100, 75); // Increased resolution (was 64x48)
    video.hide();
}

function draw() {
    background(0); // Deep black background

    if (!isInitialized || !video || !video.loadedmetadata) {
        return;
    }

    // 1. Camera Smoothing (Lerp)
    // Map mouse to camera rotation/position for "Look Around" effect
    let mX = (mouseX - width / 2);
    let mY = (mouseY - height / 2);

    targetCamX = mX * 0.8; // Increased range
    targetCamY = mY * 0.8;

    // Smooth interpolation (lerp)
    camX = lerp(camX, targetCamX, 0.05);
    camY = lerp(camY, targetCamY, 0.05);

    // Apply Camera
    camera(camX, camY, camZ + 300, // Zoom out slightly for bigger grid
        0, 0, 0,       // Center
        0, 1, 0);      // Up

    // 2. Lighting
    // Ambient light for base visibility of black pillars
    ambientLight(30);
    // Directional light from "screen"
    directionalLight(255, 255, 255, 0, 0, -1);
    // Point light following mouse?
    pointLight(255, 0, 0, camX, camY, 200);

    // 3. 3D Pillar Loading
    video.loadPixels();

    // We render a grid of boxes centered at (0,0)
    // Vidoe source is small (64x48)
    // We want to cover a large area.

    let vw = video.width;
    let vh = video.height;

    // Pixel to World Scale
    // How big is each 'pixel' in the 3D world?
    let boxSize = 10; // Smaller boxes
    let spacing = 10; // Tighter spacing

    let totalW = vw * spacing;
    let totalH = vh * spacing;

    // Center alignment offset
    let startX = -totalW / 2;
    let startY = -totalH / 2;

    noStroke();
    // Or stroke for wireframe look? User asked: "black color pillar also pixel unit shine"
    // Maybe specualr material does this.

    // Glitch Offset Logic
    // In 3D World Units
    let maxOffsetWorld = 50;
    let currentOffset = map(mouseX, 0, width, -maxOffsetWorld, maxOffsetWorld);

    for (let y = 0; y < vh; y++) {
        for (let x = 0; x < vw; x++) {

            // Mirroring
            let mirroredX = vw - 1 - x;

            let idx = (y * vw + mirroredX) * 4;

            let r = video.pixels[idx];
            let g = video.pixels[idx + 1];
            let b = video.pixels[idx + 2];

            let bright = (r + g + b) / 3;

            // Base Position for this grid cell
            let baseX = startX + x * spacing;
            let baseY = startY + y * spacing;

            push();
            translate(baseX, baseY, 0);

            // 1. Black Pillar Base (Dark Matter)
            // Always draw this as the foundation
            if (bright < 40) {
                specularMaterial(20);
                shininess(50);
                fill(10, 10, 10);
                translate(0, 0, 10);
                box(boxSize, boxSize, 20);
            } else {
                // 2. RGB Separation
                // Instead of one box, we draw 3 if offset is non-zero
                // To prevent Z-fighting when offset is 0, we can slightly offset Z or mix.

                // Height calculation
                let zH = map(bright, 0, 255, 10, 300);

                // RED Pillar (Left/Right Shift by offset)
                push();
                translate(-currentOffset, 0, zH / 2);
                emissiveMaterial(r, 0, 0); // Pure Red component of the pixel
                // We use the pixel's 'r' value for intensity
                box(boxSize, boxSize, zH);
                pop();

                // GREEN Pillar (Center)
                push();
                translate(0, 0, zH / 2);
                emissiveMaterial(0, g, 0);
                box(boxSize, boxSize, zH);
                pop();

                // BLUE Pillar (Opposite Shift)
                push();
                translate(currentOffset, 0, zH / 2);
                emissiveMaterial(0, 0, b);
                box(boxSize, boxSize, zH);
                pop();
            }
            pop();
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
