<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { GameEngine } from '../game/Engine.js';

const props = defineProps({
  gameState: String, // 'menu', 'playing', 'gameover'
  isHost: Boolean,
  socket: Object,
  roomCode: String
});

const emit = defineEmits(['updateScore', 'updateLives', 'gameOver']);

const canvasRef = ref(null);
let gameEngine = null;

onMounted(() => {
  if (canvasRef.value) {
    // Set canvas resolution
    canvasRef.value.width = 600;
    canvasRef.value.height = 800;

    gameEngine = new GameEngine(canvasRef.value, {
      isHost: props.isHost,
      socket: props.socket,
      roomCode: props.roomCode
    }, (eventName, payload) => {
      emit(eventName, payload);
    });
    
    // Draw initial state even if not playing
    gameEngine.draw();
  }
});

onBeforeUnmount(() => {
  if (gameEngine) {
    gameEngine.stop();
  }
});

watch(() => props.gameState, (newState) => {
  if (newState === 'playing' && gameEngine) {
    gameEngine.setConfig({
      isHost: props.isHost,
      socket: props.socket,
      roomCode: props.roomCode
    });
    gameEngine.reset();
    gameEngine.start();
  } else if (newState === 'menu' && gameEngine) {
    gameEngine.stop();
    gameEngine.draw(); // draw once to show background
  }
});
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>

<style scoped>
canvas {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  image-rendering: pixelated; /* good for classic game feel if using sprites */
  border: 4px solid #333;
  border-radius: 4px;
  display: block;
}
</style>
