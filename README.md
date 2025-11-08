#  Real-Time Collaborative Drawing Canvas

A multi-user real-time drawing application built using **HTML5 Canvas**, **Vanilla JavaScript**, **Node.js**, and **Socket.IO**.

Multiple users can draw together on the same canvas with live synchronization, cursor tracking, undo/redo, room support, and more.

---

##  Features

- Real-time collaborative drawing  
- Brush & eraser tools  
- Adjustable color & brush size  
- Multiple rooms (isolated canvases)  
- Online users list with unique colors  
- Real-time cursor tracking  
- Global undo/redo  
- Clear canvas  
- Smooth drawing  
- Lightweight — no frontend frameworks  

---

##  Project Structure
```
collaborative-canvas/

├── client/
│ ├── index.html
│ ├── style.css
│ ├── canvas.js
│ ├── websocket.js
│ └── main.js
├── server/
│ ├── server.js
│ ├── rooms.js
│ └── drawing-state.js
├── package.json
├── README.md
└── ARCHITECTURE.md
```
---

##  Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-link>
   cd collaborative-canvas

2. Instal Dependencies:
   ```bash
   npm install

3. Start the server:
   ```bash
   npm start

4. Open your browser:
   ```bash
   http://localhost:3000
   

Known Limitations

No user authentication

Mobile touch support not fully optimized

Performance may drop with very large strokes or many concurrent users

Undo/Redo works globally but may cause slight conflicts if many users undo simultaneously

Time Spent
   3–4 days (development, testing, and debugging)

This includes **only what is necessary** for submission: project info, setup, known limitations, and time spent.  

If you want, I can also draft the **ARCHITECTURE.md** exactly like this so you can submit both without changes. Do you want me to do that?



