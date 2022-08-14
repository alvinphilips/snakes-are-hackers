import { io } from "socket.io-client";
import * as PIXI from 'pixi.js';
import '@pixi/graphics-extras';

const socket = io('http://localhost:3000');

const WIDTH = 1280;
const HEIGHT = 720;
const HEX_GRID_RADIUS = 3;
const SQRT_3 = Math.sqrt(3);

// Div that our canvas will be added to
const game_div = document.getElementById('game');

// Input field that contains the room ID
const top_bar = document.getElementById('top_bar');
const room_id = document.getElementById('room_id');
const join_button = document.getElementById('join_room');

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

join_button.addEventListener('click', (e) => {
    e.preventDefault();
    socket.emit('join-room', room_id.value.toUpperCase(), update_top_bar);
});

const app = new PIXI.Application({ width: WIDTH, height: HEIGHT, antialias: true });

const size = 50;

game_div.appendChild(app.view);

game_div.lastElementChild.classList.add("w-full");

// Grid for our game
const hex_grid = new Map();

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

const color = [0xff0000, 0x00ff00, 0x0000ff][Math.floor(Math.random() * 3)];

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
                hex.tint = color / 2;
            })

            hex.on('pointerout', (_event) => {
                hex.tint = 0xffffff;
            })

            hex.on('pointerdown', (_event) => {
                socket.emit('place-tile', q, r, color, update_top_bar);
            })

            // Add hex tile to hex_grid Map
            hex_grid.set(`${q};${r}`, hex);

            app.stage.addChild(hex)
        }
    }
}

