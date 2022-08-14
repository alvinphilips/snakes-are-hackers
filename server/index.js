import { Server } from "socket.io";

const ROOM_NAME_REGEX = /^[A-Z]{3,5}$/;
const MAX_PLAYERS = 6;

const HEX_GRID_RADIUS = 3;

const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    }
});

const tiles = new Map();

class Game {
    constructor(room_id) {
        this.room_id = room_id;
        this.players = [];
    }
    addPlayer = (player_id) => {
        this.players.push(player_id);
    }
}

io.on('connection', (socket) => {
    // Join a Room
    socket.on('join-room', (room_id) => {
        // Check if the ROOM ID matches our RegEx
        if (room_id.match(ROOM_NAME_REGEX)) {
            console.log(`Room name ${room_id} is valid!`);
            // Leave all rooms, except the room with the same name as the socket ID
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            });

            socket.join(room_id);
        } else {
            console.log(`Room name ${room_id} is INVALID!`);
        }
    });

    // Join a Room
    socket.on('place-tile', (q, r, color, callback) => {
        if (-HEX_GRID_RADIUS <= q && q <= HEX_GRID_RADIUS
            && -HEX_GRID_RADIUS <= r && r <= HEX_GRID_RADIUS) {
            if (tiles.get(`${q};${r}`)) {
                socket.emit('set-tile', q, r, color);
                callback(false);
            } else {
                tiles.set(`${q};${r}`, socket.id);
                io.emit('set-tile', q, r, color);
                callback(true);
            }
        }
    });
});