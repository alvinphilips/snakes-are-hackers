import { io } from "socket.io-client";
import * as PIXI from 'pixi.js';
import '@pixi/graphics-extras';

const socket = io('http://localhost:3000');

// The Rendering resolution
const WIDTH = 1280;
const HEIGHT = 720;
const HEX_GRID_RADIUS = 5;
const SQRT_3 = Math.sqrt(3);

// Div that our canvas will be added to
const game_div = document.getElementById('game');

// Input field that contains the room ID
const top_bar = document.getElementById('top_bar');
const room_id = document.getElementById('room_id');
const join_button = document.getElementById('join_room');

// Grid for our game
const hex_grid = new Map();

// Update the top bar colors and alert if unsuccessful
const update_top_bar = (success, message) =>{
    // Remove neutral color classes
    top_bar.classList.remove("bg-slate-600");
    room_id.classList.remove("text-slate-900");
    join_button.classList.remove("bg-slate-900");

    if (success) {
        // Remove old styles, if present
        top_bar.classList.remove("bg-amber-600");
        room_id.classList.remove("text-amber-900");
        join_button.classList.remove("bg-amber-900");

        // Update styles
        top_bar.classList.add("bg-emerald-600");
        room_id.classList.add("text-emerald-900");
        join_button.classList.add("bg-emerald-900");
    } else {
        // Remove old styles, if present
        top_bar.classList.remove("bg-emerald-600");
        room_id.classList.remove("text-emerald-900");
        join_button.classList.remove("bg-emerald-900");

        // Update styles
        top_bar.classList.add("bg-amber-600");
        room_id.classList.add("text-amber-900");
        join_button.classList.add("bg-amber-900");

        if (message) {
            alert(message);
        }
    }
}

// Allow a player to join a room
join_button.addEventListener('click', (e) => {
    e.preventDefault();
    socket.emit('join-room', room_id.value.toUpperCase(), (success, message) => {
        update_top_bar(success, message);

        if (!success) {
            return;
        }
        const game_colors = new Map(message);
        for (let [key, value] of hex_grid) {
            hex_grid.get(key).tint = 0xffffff;
            hex_grid.get(key).interactive = true;
            if (game_colors.has(key)) {
                value.tint = game_colors.get(key);
                value.interactive = false;
            }
        }
    });
});

// The PIXIjs Application
const app = new PIXI.Application({ width: WIDTH, height: HEIGHT, antialias: true });

const size = 30;

// Add the Canvas to the DOM
game_div.appendChild(app.view);

// Apply TailwindCSS styles to the canvas
game_div.lastElementChild.classList.add("w-full");

// Function to get cartesian coordinates from a hexagonal coordinate
// See https://www.redblobgames.com/grids/hexagons/#coordinates for more info
const getXYfromCubeCoords = (q, r) => {
    let x = size * (SQRT_3 * q + SQRT_3/2 * r);
    let y = size * (1.5 * r);
    return [x, y]
}

socket.on('set-tile', (q, r, color) => {
    const hex = hex_grid.get(`${q};${r}`);
    hex.tint = color;
    hex.interactive = false;
})

for (let q = -HEX_GRID_RADIUS; q <= HEX_GRID_RADIUS; q++) {
    for (let r = -HEX_GRID_RADIUS; r <= HEX_GRID_RADIUS; r++) {
        let k = -q -r;
        if (-HEX_GRID_RADIUS <= k && k <= HEX_GRID_RADIUS) {
            const [x, y] = getXYfromCubeCoords(q, r);
            const hex = new PIXI.Graphics();
            hex.beginFill(0xffffff);
            hex.drawRegularPolygon(WIDTH / 2 + x, HEIGHT / 2 + y, size, 6);
            hex.interactive = true

            hex.on('pointerover', (_event) => {
                hex.tint = 0xdadfdc;
            })

            hex.on('pointerout', (_event) => {
                hex.tint = 0xffffff;
            })

            hex.on('pointerdown', (_event) => {
                socket.emit('place-tile', q, r, update_top_bar);
            })

            // Add hex tile to hex_grid Map
            hex_grid.set(`${q};${r}`, hex);

            // Add hex tile to the PIXI Application
            app.stage.addChild(hex)
        }
    }
}

