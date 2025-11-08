// =====================================================
//  CANVAS DRAWING LOGIC (ES MODULE)
// =====================================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Active WS socket
let socket = null;

// Active drawing state
let isDrawing = false;
let currentStroke = null;
let localSegments = [];

const EMIT_INTERVAL = 25;
const SMOOTH_WINDOW = 4;

// Export setter for socket
export function setSocket(ioSocket) {
    socket = ioSocket;
}

// Canvas resizing (static size for simplicity)
function resizeCanvas() {
    canvas.width = window.innerWidth - 40;   // adjust if needed for sidebar
    canvas.height = window.innerHeight - 100; // adjust for header
    if (window._strokesCache) redrawFromState(window._strokesCache);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Get position relative to canvas
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Start stroke
function startStroke(pos) {
    const tool = window._tool || "brush";
    const color = window._color || "#000";
    const size = window._size || 4;

    currentStroke = {
        id: "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        userId: null,
        mode: tool === "eraser" ? "erase" : "draw",
        color,
        width: size,
        points: [pos]
    };

    isDrawing = true;

    if (!window._emitTimer) {
        window._emitTimer = setInterval(() => {
            if (!socket || localSegments.length === 0) return;
            const batch = [...localSegments];
            localSegments = [];
            socket.emit("stroke-progress", { segment: { batch } });
        }, EMIT_INTERVAL);
    }
}

// Draw segment
function drawSegment(points, style) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = style.width;
    ctx.globalCompositeOperation = style.mode === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = style.color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
    ctx.restore();
}

// Draw full stroke
function drawStroke(stroke) {
    if (!stroke.points || stroke.points.length < 2) return;
    drawSegment(stroke.points, stroke);
}

// Handle drawing events
canvas.onpointerdown = (e) => startStroke(getPos(e));
canvas.onpointermove = (e) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getPos(e);
    currentStroke.points.push(pos);
    const pts = currentStroke.points.slice(-SMOOTH_WINDOW - 1);
    drawSegment(pts, currentStroke);
    const prev = currentStroke.points[currentStroke.points.length - 2] || pos;
    localSegments.push({
        id: currentStroke.id,
        mode: currentStroke.mode,
        color: currentStroke.color,
        width: currentStroke.width,
        points: [prev, pos]
    });
    if (socket) socket.emit("cursor", { x: pos.x, y: pos.y });
};
window.onpointerup = window.onpointerleave = () => finishStroke();

function finishStroke() {
    if (!isDrawing || !currentStroke) return;
    if (socket) socket.emit("stroke-commit", { stroke: currentStroke });
    isDrawing = false;
    currentStroke = null;
    localSegments = [];
    if (window._emitTimer) {
        clearInterval(window._emitTimer);
        window._emitTimer = null;
    }
}

// Apply remote progress
export function applyProgress(segmentOrBatch) {
    if (!segmentOrBatch) return;
    const segments = segmentOrBatch.batch || [segmentOrBatch];
    for (const seg of segments) drawSegment(seg.points, seg);
}

// Redraw from full state
export function redrawFromState(strokes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!Array.isArray(strokes)) return;
    for (const stroke of strokes) drawStroke(stroke);
}

// ==============================
// SAVE & LOAD
// ==============================
export function saveDrawing() {
    if (!window._strokesCache) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window._strokesCache));
    const dlAnchor = document.createElement('a');
    dlAnchor.href = dataStr;
    dlAnchor.download = "drawing.json";
    dlAnchor.click();
}

export function loadDrawing(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const strokes = JSON.parse(e.target.result);
            if (!Array.isArray(strokes)) throw new Error("Invalid file format");

            // Update local cache
            window._strokesCache = strokes;
            redrawFromState(strokes);

            // Emit to server if socket is connected
            if (socket && socket.connected) {
                strokes.forEach(stroke => {
                    socket.emit("stroke-commit", { stroke });
                });
            }
        } catch (err) {
            console.error("Failed to load drawing:", err);
            alert("Invalid drawing file.");
        }
    };
    reader.readAsText(file);
}
