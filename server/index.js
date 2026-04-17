import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

// Helper to generate a 4-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Host creates a room
  socket.on('createRoom', (callback) => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms[roomCode]);

    rooms[roomCode] = { host: socket.id, client: null };
    socket.join(roomCode);
    console.log(`Room created: ${roomCode} by host: ${socket.id}`);
    callback({ roomCode });
  });

  // Client joins a room
  socket.on('joinRoom', (roomCode, callback) => {
    roomCode = roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      return callback({ error: 'Room not found' });
    }
    if (room.client) {
      return callback({ error: 'Room is already full' });
    }

    room.client = socket.id;
    socket.join(roomCode);
    console.log(`User ${socket.id} joined room ${roomCode}`);

    // Notify host that player 2 joined
    io.to(room.host).emit('playerJoined');
    callback({ success: true });
  });

  // Game state from Host to Client
  socket.on('gameState', (data) => {
    // Forward state to the entire room except the sender
    socket.broadcast.to(data.roomCode).emit('gameState', data);
  });

  // Inputs from Client to Host
  socket.on('playerInput', (data) => {
    // Forward input to the entire room except sender
    socket.broadcast.to(data.roomCode).emit('playerInput', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find room and notify other player
    for (const [code, room] of Object.entries(rooms)) {
      if (room.host === socket.id || room.client === socket.id) {
        io.to(code).emit('playerLeft');
        delete rooms[code];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
