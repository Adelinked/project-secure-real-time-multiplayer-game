require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const socket = require('socket.io'); // Import socket.io
const http = require('http'); // Import http module
const Collectible = require('./public/Collectible.mjs');
const { START_X, END_X, START_Y, END_Y, GAME_WIDTH, GAME_HEIGHT, SPEED, COLLECTIBLE_SIZE} = require('./public/variables.mjs'); 
 
function randomPosition (size) {
  const x = Math.max(START_X, Math.min(END_X - 0.5 * size, Math.floor(Math.random() * GAME_WIDTH) + START_X));
  const y = Math.max(START_Y, Math.min(END_Y - 0.5 * size, Math.floor(Math.random() * GAME_HEIGHT) + START_Y));
  return {x, y};
}
 
const app = express();
app.use(helmet());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.createServer(app); // Create an http server instance

const io = socket(server);

let players = [];


const position = randomPosition(COLLECTIBLE_SIZE);

let coin = new Collectible({id : 1, x : position.x, y : position.y, value : 1});

io.on('connection', (socket) => {
  socket.emit('init', { id: socket.id, players, coin });
  socket.on('playerConnected', (playerData) => {
    players.push(playerData);
    socket.broadcast.emit('playerJoined', playerData);
  });


  socket.on('playerMovement', (player) => {
    socket.broadcast.emit('playerMoved', player);
    players = players.map(p => p.id == player.id ? player : p);
  });
  socket.on('collision', (player) => {
    const newScore = player.score + coin.value;
    player.score = newScore;
    const coinPosition = randomPosition(COLLECTIBLE_SIZE);
    coin.x = coinPosition.x;
    coin.y = coinPosition.y;
    const newValue = (coin.value + 1) % 4;
    coin.value = newValue == 0 ? 1 : newValue;
    coin.id = coin.id + 1;
    socket.emit('newScore', newScore);
    players = players.map(p => p.id == player.id ? player : p);
    socket.broadcast.emit('playerCollision', player);
    io.emit('newCoin', coin);
  });

  socket.on('disconnect', () => {
    const disconnectedIndex = players.findIndex(player => player.id === socket.id);
    if (disconnectedIndex !== -1) {
      const disconnectedPlayer = players.splice(disconnectedIndex, 1)[0]; 
      socket.broadcast.emit('playerLeft', disconnectedPlayer.id); 
    }
  });

  
});

server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});



module.exports = app; // For testing
