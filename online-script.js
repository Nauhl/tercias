const socket = io();
let myPlayerId = null;
let myPlayerIndex = -1;
let gameData = {
    players: [],
    currentPlayer: 0,
    myHand: []
};

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const waitingRoom = document.getElementById('waitingRoom');
const gameScreen = document.getElementById('gameScreen');
const connectionStatus = document.getElementById('connectionStatus');
const playersScores = document.getElementById('playersScores');
const currentPlayerName = document.getElementById('currentPlayerName');
const playArea = document.getElementById('playArea');
const playerHand = document.getElementById('playerHand');
const cardsLeft = document.getElementById('cardsLeft');
const drawCardBtn = document.getElementById('drawCardBtn');
const endTurnBtn = document.getElementById('endTurnBtn');
const victoryModal = document.getElementById('victoryModal');
const winnerInfo = document.getElementById('winnerInfo');
const playAgainBtn = document.getElementById('playAgainBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeModal = document.querySelector('.close');

// Eventos de conexión
socket.on('connect', () => {
    connectionStatus.textContent = 'Conectado';
    connectionStatus.className = 'connection-status connected';
});

socket.on('disconnect', () => {
    connectionStatus.textContent = 'Desconectado';
    connectionStatus.className = 'connection-status disconnected';
});

// Unirse al juego
function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (playerName) {
        socket.emit('joinGame', playerName);
    } else {
        alert('Por favor ingresa tu nombre');
    }
}

// Eventos del juego
socket.on('playerJoined', (data) => {
    myPlayerId = data.playerId;
    myPlayerIndex = data.playerIndex;
    loginScreen.style.display = 'none';
    waitingRoom.style.display = 'block';
});

socket.on('playersUpdate', (players) => {
    gameData.players = players;
    updatePlayersList();
    if (gameScreen.style.display !== 'none') {
        renderScoreboard();
    }
});

socket.on('gameStarted', (data) => {
    gameData = { ...gameData, ...data };
    waitingRoom.style.display = 'none';
    gameScreen.style.display = 'block';
    
    renderScoreboard();
    updateCurrentPlayer();
    cardsLeft.textContent = data.deckSize;
});

socket.on('handUpdate', (hand) => {
    gameData.myHand = hand;
    renderPlayerHand();
});

socket.on('cardPlayed', (data) => {
    // Mostrar carta jugada en el área de juego
    const cardElement = createCardElement(data.card);
    playArea.appendChild(cardElement);
    
    // Actualizar puntuación
    gameData.players[data.playerIndex].score += data.points;
    renderScoreboard();
});

socket.on('cardDrawn', (card) => {
    gameData.myHand.push(card);
    renderPlayerHand();
});

socket.on('deckUpdate', (size) => {
    cardsLeft.textContent = size;
});

socket.on('turnChange', (currentPlayer) => {
    gameData.currentPlayer = currentPlayer;
    updateCurrentPlayer();
    playArea.innerHTML = ''; // Limpiar área de juego
});

socket.on('gameEnded', (data) => {
    showVictoryAnimation(data.winner, data.ranking, data.reason);
});

socket.on('gameFull', () => {
    alert('El juego está lleno. Intenta más tarde.');
});

// Funciones de renderizado
function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    gameData.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = `${index + 1}. ${player.name}`;
        if (player.id === myPlayerId) {
            playerDiv.style.fontWeight = 'bold';
            playerDiv.style.color = '#22c55e';
        }
        playersList.appendChild(playerDiv);
    });
}

function renderScoreboard() {
    playersScores.innerHTML = '';
    
    const sortedPlayers = [...gameData.players].sort((a, b) => b.score - a.score);
    
    sortedPlayers.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-score';
        
        if (gameData.players.indexOf(player) === gameData.currentPlayer) {
            playerElement.classList.add('active');
        }
        
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';
        
        playerElement.innerHTML = `
            <div>${medal} ${player.name}</div>
            <div>${player.score} pts</div>
        `;
        
        playersScores.appendChild(playerElement);
    });
}

function updateCurrentPlayer() {
    if (gameData.players[gameData.currentPlayer]) {
        currentPlayerName.textContent = gameData.players[gameData.currentPlayer].name;
    }
}

function renderPlayerHand() {
    playerHand.innerHTML = '';
    gameData.myHand.forEach(card => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener('click', () => playCard(card));
        playerHand.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card card-front ${card.color}`;
    cardElement.textContent = `${card.value}${card.suit}`;
    return cardElement;
}

function playCard(card) {
    if (myPlayerIndex === gameData.currentPlayer) {
        socket.emit('playCard', card);
        
        // Remover carta de la mano local
        const cardIndex = gameData.myHand.findIndex(c => 
            c.suit === card.suit && c.value === card.value
        );
        if (cardIndex !== -1) {
            gameData.myHand.splice(cardIndex, 1);
            renderPlayerHand();
        }
    }
}

function showVictoryAnimation(winner, ranking, reason) {
    let victoryMessage = '';
    switch(reason) {
        case 'score_limit':
            victoryMessage = '🎯 ¡Alcanzó 100 puntos!';
            break;
        case 'empty_hand':
            victoryMessage = '🃏 ¡Se quedó sin cartas!';
            break;
        case 'deck_empty':
            victoryMessage = '📦 ¡Se acabó el mazo!';
            break;
    }
    
    winnerInfo.innerHTML = `
        <div>🏆 <strong>${winner.name}</strong> 🏆</div>
        <div style="font-size: 0.7em; margin-top: 5px; color: #fbbf24;">${victoryMessage}</div>
        <div style="font-size: 0.8em; margin-top: 10px;">${winner.score} puntos</div>
        <div style="font-size: 0.6em; margin-top: 15px; opacity: 0.9;">
            🥈 2°: ${ranking[1].name} (${ranking[1].score} pts)<br>
            🥉 3°: ${ranking[2].name} (${ranking[2].score} pts)<br>
            🏅 4°: ${ranking[3].name} (${ranking[3].score} pts)
        </div>
    `;
    
    victoryModal.style.display = 'block';
}

// Event listeners
drawCardBtn.addEventListener('click', () => {
    if (myPlayerIndex === gameData.currentPlayer) {
        socket.emit('drawCard');
    }
});

endTurnBtn.addEventListener('click', () => {
    if (myPlayerIndex === gameData.currentPlayer) {
        socket.emit('endTurn');
    }
});

playAgainBtn.addEventListener('click', () => {
    victoryModal.style.display = 'none';
    socket.emit('newGame');
});

infoBtn.addEventListener('click', () => {
    infoModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    infoModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === infoModal) {
        infoModal.style.display = 'none';
    }
});

// Enter para unirse al juego
document.getElementById('playerName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinGame();
    }
});