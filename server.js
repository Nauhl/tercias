const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'online.html'));
});

// Estado del juego
let gameState = {
    players: [],
    currentPlayer: 0,
    deck: [],
    gameStarted: false,
    gameEnded: false
};

// Crear baraja
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (let suit of suits) {
        for (let value of values) {
            deck.push({
                suit: suit,
                value: value,
                color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
            });
        }
    }
    
    // Mezclar
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

// Manejar conexiones
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    
    // Unirse al juego
    socket.on('joinGame', (playerName) => {
        if (gameState.players.length < 4 && !gameState.gameStarted) {
            const player = {
                id: socket.id,
                name: playerName,
                hand: [],
                score: 0
            };
            
            gameState.players.push(player);
            socket.emit('playerJoined', { playerId: socket.id, playerIndex: gameState.players.length - 1 });
            io.emit('playersUpdate', gameState.players);
            
            if (gameState.players.length === 4) {
                startGame();
            }
        } else {
            socket.emit('gameFull');
        }
    });
    
    // Jugar carta
    socket.on('playCard', (cardData) => {
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        if (playerIndex === gameState.currentPlayer && !gameState.gameEnded) {
            const player = gameState.players[playerIndex];
            const cardIndex = player.hand.findIndex(c => 
                c.suit === cardData.suit && c.value === cardData.value
            );
            
            if (cardIndex !== -1) {
                const card = player.hand.splice(cardIndex, 1)[0];
                const points = getCardValue(card);
                player.score += points;
                
                io.emit('cardPlayed', { playerIndex, card, points });
                io.emit('playersUpdate', gameState.players);
                
                checkWinConditions();
            }
        }
    });
    
    // Robar carta
    socket.on('drawCard', () => {
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        if (playerIndex === gameState.currentPlayer && !gameState.gameEnded && gameState.deck.length > 0) {
            const player = gameState.players[playerIndex];
            if (player.hand.length < 7) {
                const card = gameState.deck.pop();
                player.hand.push(card);
                socket.emit('cardDrawn', card);
                io.emit('deckUpdate', gameState.deck.length);
            }
        }
    });
    
    // Terminar turno
    socket.on('endTurn', () => {
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        if (playerIndex === gameState.currentPlayer && !gameState.gameEnded) {
            nextTurn();
        }
    });
    
    // Nueva partida
    socket.on('newGame', () => {
        if (gameState.players.length === 4) {
            startGame();
        }
    });
    
    // Desconexión
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        io.emit('playersUpdate', gameState.players);
        
        if (gameState.players.length === 0) {
            resetGame();
        }
    });
});

function startGame() {
    gameState.deck = createDeck();
    gameState.currentPlayer = 0;
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    
    // Repartir cartas
    gameState.players.forEach(player => {
        player.hand = [];
        player.score = 0;
        for (let i = 0; i < 5; i++) {
            player.hand.push(gameState.deck.pop());
        }
    });
    
    io.emit('gameStarted', {
        players: gameState.players,
        currentPlayer: gameState.currentPlayer,
        deckSize: gameState.deck.length
    });
    
    // Enviar manos a cada jugador
    gameState.players.forEach((player, index) => {
        io.to(player.id).emit('handUpdate', player.hand);
    });
}

function nextTurn() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    io.emit('turnChange', gameState.currentPlayer);
}

function getCardValue(card) {
    let value = 0;
    if (card.value === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(card.value)) value = 10;
    else value = parseInt(card.value);
    
    if (card.color === 'red') value += 2;
    return value;
}

function checkWinConditions() {
    // Victoria por 100 puntos
    const highScorer = gameState.players.find(player => player.score >= 100);
    if (highScorer) {
        endGame('score_limit', highScorer);
        return;
    }
    
    // Victoria por quedarse sin cartas
    const emptyHand = gameState.players.find(player => player.hand.length === 0);
    if (emptyHand) {
        endGame('empty_hand', emptyHand);
        return;
    }
    
    // Victoria por mazo vacío
    if (gameState.deck.length === 0) {
        const winner = gameState.players.reduce((prev, current) => 
            prev.score > current.score ? prev : current
        );
        endGame('deck_empty', winner);
        return;
    }
}

function endGame(reason, winner) {
    gameState.gameEnded = true;
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    
    io.emit('gameEnded', {
        reason,
        winner,
        ranking: sortedPlayers
    });
}

function resetGame() {
    gameState = {
        players: [],
        currentPlayer: 0,
        deck: [],
        gameStarted: false,
        gameEnded: false
    };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});