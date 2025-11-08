// =====================================================
//  WEBSOCKET LOGIC (ES MODULE)
// =====================================================
import { setSocket, applyProgress, redrawFromState } from "./canvas.js";

// For user list rendering
function renderUsers(users) {
    const ul = document.getElementById("users");
    ul.innerHTML = "";

    Object.values(users)
        .sort((a, b) => a.serial - b.serial)
        .forEach(u => {
            const li = document.createElement("li");
            li.textContent = `${u.serial}. ${u.name}`;
            li.style.background = u.color;
            ul.appendChild(li);
        });
}

// Cursor DOM elements
function renderCursor(data) {
    let el = document.getElementById("cursor-" + data.id);

    if (!el) {
        el = document.createElement("div");
        el.id = "cursor-" + data.id;
        el.className = "cursor-tag";

        const dot = document.createElement("div");
        dot.className = "cursor-dot";

        const lbl = document.createElement("div");
        lbl.className = "cursor-label";
        lbl.textContent = data.name;

        el.appendChild(dot);
        el.appendChild(lbl);

        document.body.appendChild(el);
    }

    const scroll = document.querySelector(".canvas-scroll").getBoundingClientRect();
    const canvasScroll = document.querySelector(".canvas-scroll");

    el.style.left = (scroll.left + data.x - canvasScroll.scrollLeft) + "px";
    el.style.top  = (scroll.top + data.y - canvasScroll.scrollTop) + "px";

    el.querySelector(".cursor-dot").style.background = data.color;
    el.querySelector(".cursor-label").style.background = data.color;
}

// =====================================================
//  MAIN CONNECT FUNCTION
// =====================================================
export function connectSocket(name, roomId) {
    const socket = io();
    setSocket(socket);

    window.socket = socket;

    // Join room
    socket.on("connect", () => {
        socket.emit("join-room", { name, roomId });
    });

    // Full initial state
    socket.on("state", ({ strokes, users }) => {
        window._strokesCache = strokes;
        redrawFromState(strokes);
        renderUsers(users);
    });

    // User updates
    socket.on("users", (users) => renderUsers(users));

    // Remote live segment
    socket.on("stroke-progress", ({ segment }) => {
        applyProgress(segment);
    });

    // Remote committed stroke (final)
    socket.on("stroke-added", ({ stroke }) => {
        applyProgress(stroke);
    });

    // Cursor movement
    socket.on("cursor", (data) => {
        renderCursor(data);
    });

    // Remove cursor of disconnected users
    socket.on("remove-cursor", ({ id }) => {
        const el = document.getElementById("cursor-" + id);
        if (el) el.remove();
    });

    // Undo/Redo
    window.emitUndo = () => socket.emit("undo");
    window.emitRedo = () => socket.emit("redo");

    // Clear
    window.emitClear = () => socket.emit("clear");
}
