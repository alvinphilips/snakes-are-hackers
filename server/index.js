import { Server } from "socket.io";

const ROOM_NAME_REGEX = /^[A-Z]{3,5}$/;
const MAX_PLAYERS = 6;

const HEX_GRID_RADIUS = 3;

const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    }
});

const players = new Map();

class Game {
    constructor() {
        this.tiles = new Map();
    }
}

const games = new Map();

io.on('connection', (socket) => {
    // Join a Room
    socket.on('join-room', (room_id, callback) => {
        // Check if the ROOM ID matches our RegEx
        if (room_id.match(ROOM_NAME_REGEX)) {
            // Leave all rooms, except the room with the same name as the socket ID
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            });

            // Check if the room is already in use
            if (io.sockets.adapter.rooms.get(room_id)) {
                // Check if the room is full
                if (io.sockets.adapter.rooms[room_id]?.size > MAX_PLAYERS) {
                    callback(false, "Room is full");
                } else {
                    // Join the room
                    socket.join(room_id);
                    if (!games.has(room_id)) {
                        console.log("We shouldn't ideally reach here");

                        // Start a new Game
                        games.set(room_id, new Game());
                    }
                }
            } else {
                games.set(room_id, new Game());
                socket.join(room_id);
            }
            socket.join(room_id);
            players.set(socket.id, room_id);
            callback(true);
        } else {
            callback(false, "Invalid room ID");
        }
    });

    // Join a Room
    socket.on('place-tile', (q, r, color, callback) => {
        if (-HEX_GRID_RADIUS <= q && q <= HEX_GRID_RADIUS
            && -HEX_GRID_RADIUS <= r && r <= HEX_GRID_RADIUS) {
            const room_id = players.get(socket.id);
            const game = games.get(room_id);
            if (!game) {
                callback(false, "Player is not in a room")
                return;
            }
            if (game.tiles.get(`${q};${r}`)) {
                socket.emit('set-tile', q, r, color);
                callback(false);
            } else {
                game.tiles.set(`${q};${r}`, socket.id);
                socket.emit('set-tile', q, r, color);
                socket.to(room_id).emit('set-tile', q, r, color);
                callback(true);
            }
        }
    });
});