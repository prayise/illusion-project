# Interactive RGB Glitch Mirror

A web-based interactive digital mirror that transforms your webcam feed into a 3D cyberpunk voxel experience.

## Features
- **3D Voxel Rendering**: Your video feed is reconstructed using thousands of 3D cubes.
- **RGB Glitch Effect**: Move your mouse to physically separate the Red, Green, and Blue channels in 3D space.
- **Dark Matter Pillars**: Low-light areas are rendered as shiny black structures, preserving the depth of the scene.
- **Privacy First**: All video processing happens locally in your browser. No data is sent to any server.

## 🚀 How to Run

### Requirement
You need a webcam and a modern web browser (Chrome, Firefox, Safari).

### Local Server (Recommended)
Because this project uses the Camera API, it requires a secure context (`HTTPS` or `localhost`). You cannot just open `index.html` file directly.

1.  **Install a local server** (if not installed):
    ```bash
    npm install -g http-server
    ```

2.  **Run the project**:
    ```bash
    npx http-server .
    ```

3.  **Open in Browser**:
    Visit `http://127.0.0.1:8080`

## 🎮 How to Play
1.  Click **INITIALIZE LINK** on the welcome screen.
2.  Allow **Camera Access** when prompted.
3.  **Interactions**:
    - **Mouse Center**: Normal Color Mode.
    - **Mouse Left/Right**: Splits the Image into RGB components (Glitch Effect).
    - **Mouse Up/Down**: Tilts the Camera view.

## Technologies
- **p5.js** (WebGL Mode)
- HTML5 / CSS3

## License
MIT
