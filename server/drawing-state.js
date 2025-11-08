export class DrawingState {
    constructor() {
        this.rooms = new Map();
        // roomId → { strokes: [], redo: [] }
    }

    ensure(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, { strokes: [], redo: [] });
        }
        return this.rooms.get(roomId);
    }

    getAll(roomId) {
        return this.ensure(roomId).strokes.slice();
    }

    pushStroke(roomId, stroke) {
        const room = this.ensure(roomId);
        room.strokes.push(stroke);
        room.redo = [];
        return room.strokes.slice();
    }

    undo(roomId) {
        const room = this.ensure(roomId);
        if (room.strokes.length === 0) return null;

        const s = room.strokes.pop();
        room.redo.push(s);

        return room.strokes.slice();
    }

    redo(roomId) {
        const room = this.ensure(roomId);
        if (room.redo.length === 0) return null;

        const s = room.redo.pop();
        room.strokes.push(s);

        return room.strokes.slice();
    }

    clear(roomId) {
        const room = this.ensure(roomId);
        room.strokes = [];
        room.redo = [];
        return [];
    }
}
