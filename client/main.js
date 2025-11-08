import { connectSocket } from "./websocket.js";
import { saveDrawing, loadDrawing } from "./canvas.js";

// DOM Elements
const joinBtn = document.getElementById("joinBtn");
const newRoomBtn = document.getElementById("newRoom");
const usernameInput = document.getElementById("username");
const roomSelect = document.getElementById("roomSelect");

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const loadInput = document.createElement("input");
loadInput.type = "file";
loadInput.accept = ".json";
loadInput.style.display = "none";
document.body.appendChild(loadInput);

// State
let currentRoom = null;
let username = null;
let roomCounter = 1;

// Initialize Room 1
function addRoomOption(roomNumber) {
    const opt = document.createElement("option");
    opt.value = roomNumber;
    opt.textContent = `Room ${roomNumber}`;
    roomSelect.appendChild(opt);
}
addRoomOption(roomCounter);
roomSelect.value = roomCounter;

// New Room
newRoomBtn.onclick = () => {
    roomCounter++;
    addRoomOption(roomCounter);
    roomSelect.value = roomCounter;
};

// Join Room
joinBtn.onclick = () => {
    username = usernameInput.value.trim();
    if (!username) return alert("Enter your name!");
    currentRoom = roomSelect.value;
    if (!currentRoom) return alert("Select a room!");

    connectSocket(username, currentRoom);
    document.getElementById("modal").style.display = "none";
};

// Toolbar
function setActiveTool(toolBtn) {
    [brushBtn, eraserBtn].forEach(btn => btn.classList.remove("active"));
    toolBtn.classList.add("active");
}
brushBtn.onclick = () => { window._tool = "brush"; setActiveTool(brushBtn); };
eraserBtn.onclick = () => { window._tool = "eraser"; setActiveTool(eraserBtn); };
undoBtn.onclick = () => window.emitUndo && window.emitUndo();
redoBtn.onclick = () => window.emitRedo && window.emitRedo();
clearBtn.onclick = () => window.emitClear && window.emitClear();
colorPicker.oninput = (e) => window._color = e.target.value;
brushSize.oninput = (e) => window._size = parseInt(e.target.value, 10);
window._tool = "brush"; window._color = "#000000"; window._size = 4;
setActiveTool(brushBtn);

// ---------------------------
// Save & Load
// ---------------------------
saveBtn.onclick = () => saveDrawing();

loadBtn.onclick = () => loadInput.click();
loadInput.onchange = (e) => {
    if (loadInput.files.length > 0) {
        const file = loadInput.files[0];
        loadDrawing(file);
        loadInput.value = "";
    }
};

// Room change
roomSelect.onchange = () => {
    if (username) {
        currentRoom = roomSelect.value;
        connectSocket(username, currentRoom);
    }
};
