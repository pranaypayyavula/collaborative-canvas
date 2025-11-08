import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Rooms } from "./rooms.js";
import { DrawingState } from "./drawing-state.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

// Serve client folder
app.use(express.static("client"));

const rooms = new Rooms();
const drawing = new DrawingState();

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Color palette for users (unique per room)
const COLORS = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A8",
    "#FF8F33", "#8D33FF", "#33FFF6", "#FFE733"
];

// ------------- SOCKET.IO LOGIC ------------------
io.on("connection", socket => {

    socket.on("join-room", ({ name, roomId }) => {
        if (!name || !roomId) return;

        // Assign unique user color
        const existing = Object.values(rooms.getUsers(roomId))
            .map(u => u.color);

        const color = COLORS.find(c => !existing.includes(c)) ||
                      COLORS[Math.floor(Math.random() * COLORS.length)];

        rooms.addUser(roomId, socket.id, name, color);

        socket.join(roomId);

        // Send full state & users to the newly joined client
        socket.emit("state", {
            strokes: drawing.getAll(roomId),
            users: rooms.getUsers(roomId)
        });

        // Notify others
        io.to(roomId).emit("users", rooms.getUsers(roomId));
    });

    // Real-time segment (during drawing)
    socket.on("stroke-progress", ({ segment }) => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        socket.to(roomId).emit("stroke-progress", { segment });
    });

    // Final stroke
    socket.on("stroke-commit", ({ stroke }) => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        stroke.userId = socket.id;

        drawing.pushStroke(roomId, stroke);

        io.to(roomId).emit("stroke-added", { stroke });
    });

    // Cursor updates
    socket.on("cursor", (data) => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        const user = rooms.getUsers(roomId)[socket.id];
        if (!user) return;

        data.id = socket.id;
        data.name = user.name;
        data.color = user.color;

        socket.to(roomId).emit("cursor", data);
    });

    // Undo
    socket.on("undo", () => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        const strokes = drawing.undo(roomId);

        if (strokes !== null) {
            io.to(roomId).emit("state", {
                strokes,
                users: rooms.getUsers(roomId)
            });
        }
    });

    // Redo
    socket.on("redo", () => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        const strokes = drawing.redo(roomId);

        if (strokes !== null) {
            io.to(roomId).emit("state", {
                strokes,
                users: rooms.getUsers(roomId)
            });
        }
    });

    // Clear
    socket.on("clear", () => {
        const roomId = getUserRoom(socket);
        if (!roomId) return;

        const strokes = drawing.clear(roomId);

        io.to(roomId).emit("state", {
            strokes,
            users: rooms.getUsers(roomId)
        });
    });

    // Disconnect
    socket.on("disconnect", () => {
        const roomId = getUserRoom(socket);

        rooms.removeUserFromAll(socket.id);

        if (roomId) {
            io.to(roomId).emit("users", rooms.getUsers(roomId));
            io.to(roomId).emit("remove-cursor", { id: socket.id });
        }
    });
});

function getUserRoom(socket) {
    const roomsList = [...socket.rooms].filter(r => r !== socket.id);
    return roomsList[0] || null;
}
