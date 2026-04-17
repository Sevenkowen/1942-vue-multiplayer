<script setup>
import { ref } from 'vue';
import { io } from 'socket.io-client';
import GameCanvas from './components/GameCanvas.vue';
import GameOverlay from './components/GameOverlay.vue';

const gameState = ref('menu'); // 'menu', 'lobby', 'playing', 'gameover'
const score = ref(0);
const lives = ref(2);
const roomCode = ref('');
const isHost = ref(true);
let socket = null;

const startGame = (options = { mode: 'single' }) => {
  if (options.mode === 'single') {
    score.value = 0;
    lives.value = 2;
    isHost.value = true;
    socket = null; // No socket for single player
    gameState.value = 'playing';
  } else if (options.mode === 'host') {
    connectSocket();
    socket.emit('createRoom', (res) => {
      roomCode.value = res.roomCode;
      isHost.value = true;
      gameState.value = 'lobby';
    });
  } else if (options.mode === 'join') {
    connectSocket();
    socket.emit('joinRoom', options.room, (res) => {
      if (res.error) {
        alert(res.error);
      } else {
        roomCode.value = options.room.toUpperCase();
        isHost.value = false;
        score.value = 0;
        lives.value = 2;
        gameState.value = 'playing'; // join directly
      }
    });
  }
};

const connectSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3000');
    socket.on('playerJoined', () => {
      if (isHost.value && gameState.value === 'lobby') {
        score.value = 0;
        lives.value = 2;
        gameState.value = 'playing';
      }
    });
    socket.on('playerLeft', () => {
      alert('The other player disconnected.');
      gameState.value = 'menu';
      socket.disconnect();
      socket = null;
    });
  }
};

const handleGameOver = () => {
  gameState.value = 'gameover';
};

const updateScore = (newScore) => {
  score.value = newScore;
};

const updateLives = (newLives) => {
  lives.value = newLives;
};
</script>

<template>
  <div class="app-wrapper">
    <div class="game-container">
      <GameCanvas 
        :gameState="gameState" 
        :isHost="isHost"
        :socket="socket"
        :roomCode="roomCode"
        @updateScore="updateScore"
        @updateLives="updateLives"
        @gameOver="handleGameOver"
      />
      <GameOverlay 
        :gameState="gameState" 
        :score="score"
        :lives="lives"
        :roomCode="roomCode"
        @startGame="startGame"
        @restartGame="() => startGame({ mode: socket ? 'host' : 'single' })"
      />
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #111;
}

.game-container {
  position: relative;
  width: 600px;
  height: 800px;
}
</style>
