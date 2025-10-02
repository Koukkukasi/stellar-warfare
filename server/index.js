const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Game = require('./game');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;
const TICK_RATE = 60; // 60Hz server tick rate
const TICK_INTERVAL = 1000 / TICK_RATE;

// Game instances map (room-based matchmaking)
const games = new Map();
let gameIdCounter = 0;

// Matchmaking queue
const matchmakingQueue = [];
const MAX_PLAYERS_PER_MATCH = 10;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    games: games.size,
    totalPlayers: Array.from(games.values()).reduce((sum, game) => sum + game.getPlayerCount(), 0),
    queueSize: matchmakingQueue.length
  });
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinQueue', (playerData) => {
    console.log(`Player ${socket.id} joined matchmaking queue`);

    // Add player to matchmaking queue
    matchmakingQueue.push({
      socketId: socket.id,
      socket: socket,
      playerData: playerData || { name: `Player${socket.id.substring(0, 4)}` }
    });

    // Try to create a match
    tryCreateMatch();
  });

  socket.on('playerInput', (input) => {
    const game = findGameByPlayer(socket.id);
    if (game) {
      game.handlePlayerInput(socket.id, input);
    }
  });

  socket.on('chatMessage', (message) => {
    const game = findGameByPlayer(socket.id);
    if (game) {
      game.broadcastChatMessage(socket.id, message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from matchmaking queue
    const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }

    // Remove from active game
    const game = findGameByPlayer(socket.id);
    if (game) {
      game.removePlayer(socket.id);

      // Clean up empty games
      if (game.getPlayerCount() === 0) {
        game.stop();
        games.delete(game.id);
        console.log(`Game ${game.id} destroyed (no players)`);
      }
    }
  });
});

function tryCreateMatch() {
  // Need at least 1 player to start a match (can fill rest with bots)
  if (matchmakingQueue.length >= 1) {
    const gameId = `game_${++gameIdCounter}`;
    const playersForMatch = matchmakingQueue.splice(0, Math.min(MAX_PLAYERS_PER_MATCH, matchmakingQueue.length));

    const game = new Game(gameId, io, TICK_RATE);

    // Add human players
    playersForMatch.forEach(player => {
      game.addPlayer(player.socketId, player.socket, player.playerData);
    });

    // Fill remaining slots with bots
    const botCount = MAX_PLAYERS_PER_MATCH - playersForMatch.length;
    for (let i = 0; i < botCount; i++) {
      game.addBot();
    }

    games.set(gameId, game);
    game.start();

    console.log(`Game ${gameId} created with ${playersForMatch.length} players and ${botCount} bots`);
  }
}

function findGameByPlayer(socketId) {
  for (const game of games.values()) {
    if (game.hasPlayer(socketId)) {
      return game;
    }
  }
  return null;
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Stellar Warfare server running on port ${PORT}`);
  console.log(`Tick rate: ${TICK_RATE}Hz (${TICK_INTERVAL.toFixed(2)}ms per tick)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  games.forEach(game => game.stop());
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
