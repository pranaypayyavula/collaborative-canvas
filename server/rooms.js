export class Rooms {
    constructor() {
        this.map = new Map();
        // roomId → { users: { socketId → {name,color,serial}}, nextSerial }
    }

    ensure(roomId) {
        if (!this.map.has(roomId)) {
            this.map.set(roomId, { users: {}, nextSerial: 1 });
        }
        return this.map.get(roomId);
    }

    addUser(roomId, socketId, name, color) {
        const room = this.ensure(roomId);

        const serial = room.nextSerial++;
        room.users[socketId] = {
            id: socketId,
            name,
            color,
            serial
        };
    }

    removeUser(roomId, socketId) {
        const room = this.map.get(roomId);
        if (!room) return;

        delete room.users[socketId];

        if (Object.keys(room.users).length === 0) {
            this.map.delete(roomId);
        }
    }

    removeUserFromAll(socketId) {
        for (const [roomId] of this.map.entries()) {
            this.removeUser(roomId, socketId);
        }
    }

    getUsers(roomId) {
        const room = this.map.get(roomId);
        return room ? room.users : {};
    }
}
