import Player from './Player.mjs';
import Collectible from './Collectible.mjs';
import { START_X, END_X, START_Y, END_Y, GAME_WIDTH, GAME_HEIGHT, SPEED, COLLECTIBLE_SIZE, PLAYER_SIZE } from './variables.mjs'

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = './assets/main-player.png';

const otherPlayerImage = new Image();
otherPlayerImage.src = './assets/other-player.png';

const goldCoinImage = new Image();
goldCoinImage.src = './assets/gold-coin.png';

const silverCoinImage = new Image();
silverCoinImage.src = './assets/silver-coin.png';

const bronzeCoinImage = new Image();
bronzeCoinImage.src = './assets/bronze-coin.png';

let players;
let localPlayer;
let currentCoin;

const keysPressed = {};

document.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;

  clearPlayer(localPlayer);

  // Check for diagonal movement
  if ((keysPressed['ArrowUp'] && keysPressed['ArrowRight']) || (keysPressed['w'] && keysPressed['d'])) {
    localPlayer.movePlayer('upright', SPEED);
  } else if ((keysPressed['ArrowUp'] && keysPressed['ArrowLeft']) || (keysPressed['w'] && keysPressed['a'])) {
    localPlayer.movePlayer('upleft', SPEED);
  } else if ((keysPressed['ArrowDown'] && keysPressed['ArrowRight']) || (keysPressed['s'] && keysPressed['d'])) {
    localPlayer.movePlayer('downright', SPEED);
  } else if ((keysPressed['ArrowDown'] && keysPressed['ArrowLeft']) || (keysPressed['s'] && keysPressed['a'])) {
    localPlayer.movePlayer('downleft', SPEED);
  } else {
    // Handle non-diagonal movement
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
        localPlayer.movePlayer('up', SPEED);
        break;
      case 'ArrowDown':
      case 's':
        localPlayer.movePlayer('down', SPEED);
        break;
      case 'ArrowLeft':
      case 'a':
        localPlayer.movePlayer('left', SPEED);
        break;
      case 'ArrowRight':
      case 'd':
        localPlayer.movePlayer('right', SPEED);
        break;
    }
  }
  socket.emit('playerMovement', localPlayer);
  if (localPlayer.collision(currentCoin)) {
    socket.emit('collision', localPlayer);
    clearCoin(currentCoin);
  }
});

document.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});


socket.on('init', ({ id, players: otherPlayers, coin }) => {

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawStaticElements();
  const initialX = Math.max(START_X, Math.min(END_X - PLAYER_SIZE, Math.floor(Math.random() * GAME_WIDTH) + START_X));
  const initialY = Math.max(START_Y, Math.min(END_Y - PLAYER_SIZE, Math.floor(Math.random() * GAME_HEIGHT) + START_Y));

  localPlayer = new Player({ x: initialX, y: initialY, score: 0, id });
  currentCoin = new Collectible({ ...coin })
  players = [...otherPlayers];

  socket.emit('playerConnected', localPlayer);
});

socket.on('playerJoined', (playerData) => {
  players?.push(playerData)
});

socket.on('playerMoved', (player) => {
  const movedPlayer = players.filter(p => p.id == player.id)[0]
  clearPlayer(movedPlayer);
  players = players.map(p => p.id == player.id ? player : p);
});


socket.on('newScore', newScore => {
  localPlayer.score = newScore;
});

socket.on('playerCollision', (player) => {
  players = players.map(p => p.id == player.id ? player : p);
});

socket.on('newCoin', (coin) => {
  clearCoin(currentCoin);
  currentCoin = new Collectible({ ...coin });
  drawCoin(currentCoin);
});

socket.on('playerLeft', (playerId) => {
  const index = players?.findIndex(player => player.id === playerId);
  if (index !== -1) {
    const leavingPlayer = players?.splice(index, 1);
    clearPlayer(leavingPlayer[0]);
  }
});

function drawStaticElements() {
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = '20px Arial';
  context.fillText('Controls: WASD', 20, 30);
  context.fillText('Coin Race', canvas.width / 2 - 40, 30);
  context.strokeStyle = 'gray';
  context.lineWidth = 2;
  context.strokeRect(START_X, START_Y, END_X, END_Y);
}

function drawPlayer(player, color) {
  /*context.fillStyle = color; 
  context.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE); */
  if (player.id == localPlayer.id)
    context.drawImage(playerImage, player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
  else
    context.drawImage(otherPlayerImage, player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
}

function clearPlayer(player) {
  context.fillStyle = 'black';
  context.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
}

function colorFromValue(value) {
  switch (value) {
    case 1: return "orange";
    case 2: return "gray";
    case 3: return "gold";
    default: return 'white';
  }
}

function coinImageFromValue(value) {
  switch (value) {
    case 1: return bronzeCoinImage;
    case 2: return silverCoinImage;
    case 3: return goldCoinImage;
  }
}

function clearCoin(coin) {
  const x = coin.x;
  const y = coin.y;
  /*const radius = COLLECTIBLE_SIZE; 
  context.fillStyle = 'black';
  context.beginPath();
  context.arc(x, y, radius + 2 , 0, Math.PI * 2);
  context.closePath();
  context.fill();*/
  context.fillStyle = 'black';
  context.fillRect(coin.x, coin.y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);

  coin.x = 2000;
  coin.y = 2000;
}

function drawCoin(coin) {
  if (coin) {
    const x = coin.x;
    const y = coin.y;
    /*const radius = COLLECTIBLE_SIZE; 
    let color =  colorFromValue(coin.value);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = color;
    context.fill();*/
    const coinImage = coinImageFromValue(coin.value);
    context.drawImage(coinImage, coin.x, coin.y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);
  }
}

function drawPlayers() {
  players?.forEach(p => {
    drawPlayer(p, 'red');
  })
}

function drawRank() {
  context.font = '20px Arial';
  context.fillStyle = 'black';
  context.fillRect(canvas.width - 120, 10, 100, 30);
  context.fillStyle = 'white';
  context.fillText(localPlayer.calculateRank([...players, localPlayer]), canvas.width - 120, 30);
}

// Animation loop
function animate() {
  if (localPlayer) {
    requestAnimationFrame(animate);
    drawCoin(currentCoin);
    drawPlayer(localPlayer, 'blue');
    drawPlayers();
    drawRank();
  } else {
    setTimeout(animate, 100);
  }
}

animate(); // Start the animation loop