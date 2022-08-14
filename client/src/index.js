import { io } from "socket.io-client";
import * as PIXI from 'pixi.js';
import '@pixi/graphics-extras';

const socket = io('http://localhost:3000');

const WIDTH = 1280;
const HEIGHT = 720;
const HEX_GRID_RADIUS = 3;
const SQRT_3 = Math.sqrt(3);

const app = new PIXI.Application({ width: WIDTH, height: HEIGHT, antialias: true });

const game_div = document.getElementById('game');

const size = 50;

game_div.appendChild(app.view);

game_div.firstElementChild.classList.add("w-full");

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
                socket.emit('place-tile', q, r, color, message => {
                    console.log(message);
                });
            })

            // Add hex tile to hex_grid Map
            hex_grid.set(`${q};${r}`, hex);

            app.stage.addChild(hex)
        }
    }
}

