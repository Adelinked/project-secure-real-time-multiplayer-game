import { START_X, END_X, START_Y, END_Y, COLLECTIBLE_SIZE, PLAYER_SIZE } from './variables.mjs'

const ADJST_X_START = 1;
const ADJST_X_END = 4;
const ADJST_Y_START = 1;
const ADJST_Y_END = 49;

class Player {
  constructor({ x, y, score, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }


  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y = Math.max(START_Y + ADJST_Y_START, this.y - speed);
        break;
      case 'down':
        this.y = Math.min(END_Y - PLAYER_SIZE + ADJST_Y_END, this.y + speed);
        break;
      case 'left':
        this.x = Math.max(START_X + ADJST_X_START, this.x - speed);
        break;
      case 'right':
        this.x = Math.min(END_X - PLAYER_SIZE + ADJST_X_END, this.x + speed);
        break;
      case 'upleft':
        this.y = Math.max(START_Y + ADJST_Y_START, this.y - speed);
        this.x = Math.max(START_X + ADJST_X_START, this.x - speed);
        break;
      case 'upright':
        this.y = Math.max(START_Y + ADJST_Y_START, this.y - speed);
        this.x = Math.min(END_X - PLAYER_SIZE + ADJST_X_END, this.x + speed);
        break;
      case 'downleft':
        this.y = Math.min(END_Y - PLAYER_SIZE + ADJST_Y_END, this.y + speed);
        this.x = Math.max(START_X + ADJST_X_START, this.x - speed);
        break;
      case 'downright':
        this.y = Math.min(END_Y - PLAYER_SIZE + ADJST_Y_END, this.y + speed);
        this.x = Math.min(END_X - PLAYER_SIZE + ADJST_X_END, this.x + speed);
        break;
    }
  }

  collision(item) {
    // Calculate the boundaries of the player's avatar
    const playerLeft = this.x;
    const playerRight = this.x + PLAYER_SIZE;
    const playerTop = this.y;
    const playerBottom = this.y + PLAYER_SIZE;

    // Calculate the boundaries of the collectible item
    const itemLeft = item.x;
    const itemRight = item.x + COLLECTIBLE_SIZE;
    const itemTop = item.y;
    const itemBottom = item.y + COLLECTIBLE_SIZE;

    // Check for collision
    if (
      playerLeft < itemRight &&
      playerRight > itemLeft &&
      playerTop < itemBottom &&
      playerBottom > itemTop
    ) {
      return true; // Collision detected
    }

    return false; // No collision
  }



  calculateRank(arr) {
    // Sort the players by score in descending order
    const sortedPlayers = arr.slice().sort((a, b) => b.score - a.score);

    // Find the index of the current player in the sorted array
    const currentIndex = sortedPlayers.findIndex(player => player.id === this.id);

    // Calculate the ranking
    const currentRanking = currentIndex + 1;
    const totalPlayers = sortedPlayers.length;

    return `Rank: ${currentRanking} / ${totalPlayers}`;
  }
}

export default Player;
