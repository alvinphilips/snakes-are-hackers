import { Server } from "socket.io";

const ROOM_NAME_REGEX = /^[A-Z]{3,5}$/;
const MAX_PLAYERS = 6;

const HEX_GRID_RADIUS = 3;

const COLORS = [0xF43F5E, 0xD946EF, 0x3B82F6, 0xEAB308, 0x71717A, 0x8B5CF6];

const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    }
});

const players = new Map();

class Game {
    constructor(room_id) {
        console.log(`Creating game with Room ID ${room_id}`);
        this.room_id = room_id;
        this.tiles = new Map();
    }

    getPlayers() {
        return Array.from(io.sockets.adapter.rooms.get(this.room_id));
    }

    getColor(socket_id) {
        const color_index = this.getPlayers().indexOf(socket_id) % COLORS.length;
        return COLORS[color_index];
    }

    addTile(q, r, socket_id) {
        this.tiles.set(`${q};${r}`, {socket: socket_id, color: this.getColor(socket_id)});
    }

    getTile(q, r) {
        return this.tiles.get(`${q};${r}`);
    }
}

const games = new Map();

io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);
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
                if (io.sockets.adapter.rooms.get(room_id).size >= MAX_PLAYERS) {
                    callback(false, "Room is full");
                    return;
                } else {
                    // Join the room
                    if (!games.has(room_id)) {
                        console.log("We shouldn't ideally reach here");

                        // Start a new Game
                        games.set(room_id, new Game(room_id));
                    }
                }
            } else {
                games.set(room_id, new Game(room_id));
            }
            socket.join(room_id);
            players.set(socket.id, room_id);
            console.log(games.get(room_id).getPlayers());
            callback(true, Array.from(games.get(room_id).tiles).map(([key, value]) => [key, value.color]));
        } else {
            callback(false, "Invalid room ID");
        }
    });

    // Place a tile
    socket.on('place-tile', (q, r, callback) => {
        if (-HEX_GRID_RADIUS <= q && q <= HEX_GRID_RADIUS
            && -HEX_GRID_RADIUS <= r && r <= HEX_GRID_RADIUS) {
            const room_id = players.get(socket.id);
            const game = games.get(room_id);
            if (!game) {
                callback(false, "Player is not in a room")
                return;
            }
            const tile = game.getTile(q, r);
            if (tile) {
                socket.emit('set-tile', q, r, tile.color);
                callback(false);
            } else {
                // The color of the tile is the color of the player
                const tile_color = game.getColor(socket.id);

                // Add the tile to the game and emit it to all players
                game.addTile(q, r, socket.id);
                socket.emit('set-tile', q, r, tile_color);
                socket.to(room_id).emit('set-tile', q, r, tile_color);
                callback(true);
            }
        }
    });
});