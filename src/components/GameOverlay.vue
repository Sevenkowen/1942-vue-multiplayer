<script setup>
defineProps({
  gameState: String,
  score: Number,
  lives: Number,
  roomCode: String
});

const roomCodeInput = ref('');

const emit = defineEmits(['startGame', 'restartGame']);
import { ref } from 'vue';
</script>

<template>
  <div class="overlay">
    <!-- UI while playing -->
    <!-- UI while playing -->
    <div class="hud-top" v-if="gameState === 'playing'">
      <div class="score">SCORE: {{ score }}</div>
      <div class="lives">
        <img src="/player3.png" v-for="n in Math.max(0, lives)" :key="n" class="life-icon" />
      </div>
    </div>

    <!-- Main Menu -->
    <div class="menu" v-if="gameState === 'menu'">
      <h1>1942 VUE</h1>
      <p>Controls: WASD/Arrows to move, Space to shoot</p>
      <div class="menu-buttons">
        <button @click="emit('startGame', { mode: 'single' })">SINGLE PLAYER</button>
        <button @click="emit('startGame', { mode: 'host' })">HOST MP GAME</button>
        <div class="join-group">
           <input v-model="roomCodeInput" placeholder="ROOM CODE" maxlength="4" />
           <button @click="emit('startGame', { mode: 'join', room: roomCodeInput })">JOIN</button>
        </div>
      </div>
    </div>

    <!-- Lobby -->
    <div class="menu" v-if="gameState === 'lobby'">
      <h1>LOBBY</h1>
      <p>Tell your friend to join with code:</p>
      <h2 class="room-code">{{ roomCode }}</h2>
      <p>Waiting for player 2...</p>
    </div>

    <!-- Game Over -->
    <div class="menu game-over" v-if="gameState === 'gameover'">
      <h1>GAME OVER</h1>
      <h2>FINAL SCORE: {{ score }}</h2>
      <button @click="emit('restartGame')">TRY AGAIN</button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through to canvas if needed, though buttons need pointer-events */
  display: flex;
  justify-content: center;
  align-items: center;
}

.hud-top {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
  text-shadow: 2px 2px 0 #000;
}

.lives {
  display: flex;
  gap: 10px;
}

.life-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.menu {
  pointer-events: auto; /* Enable clicks for buttons */
  background: rgba(0, 0, 0, 0.8);
  padding: 40px;
  border-radius: 10px;
  border: 4px solid #fca311;
  text-align: center;
  color: white;
  font-family: 'Press Start 2P', cursive;
}

.menu h1 {
  font-size: 32px;
  margin: 0 0 20px 0;
  color: #fca311;
  text-shadow: 3px 3px 0 #000;
}

.menu p {
  font-size: 12px;
  line-height: 1.8;
  margin-bottom: 30px;
  color: #ccc;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.join-group {
  display: flex;
  gap: 10px;
}

.join-group input {
  flex: 1;
  padding: 10px;
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
  text-align: center;
  background: #333;
  color: #fff;
  border: 2px solid #fca311;
  outline: none;
  text-transform: uppercase;
}

.room-code {
  font-size: 48px;
  color: #fff;
  letter-spacing: 10px;
  margin: 20px 0;
  text-shadow: 0 0 10px #fca311;
}

.game-over h1 {
  color: #d90429;
}

button {
  background-color: #fca311;
  color: #14213d;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.2s;
  border-radius: 0px; /* Pixel art style prefers sharp edges */
  box-shadow: 4px 4px 0 #fff;
}

button:hover {
  background-color: #e5e5e5;
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
}
</style>
