class CardGame {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        this.players = [
            { name: 'Jugador 1', hand: [], score: 0 },
            { name: 'Jugador 2', hand: [], score: 0 },
            { name: 'Jugador 3', hand: [], score: 0 },
            { name: 'Jugador 4', hand: [], score: 0 }
        ];
        this.currentPlayer = 0;
        this.playArea = [];
        this.gameEnded = false;
        
        this.initializeElements();
        this.createDeck();
        this.bindEvents();
    }
    
    initializeElements() {
        this.playersScoresElement = document.getElementById('playersScores');
        this.currentPlayerNameElement = document.getElementById('currentPlayerName');
        this.playAreaElement = document.getElementById('playArea');
        this.playerHandElement = document.getElementById('playerHand');
        this.cardsLeftElement = document.getElementById('cardsLeft');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.drawCardBtn = document.getElementById('drawCardBtn');
        this.endTurnBtn = document.getElementById('endTurnBtn');
        this.infoBtn = document.getElementById('infoBtn');
        this.infoModal = document.getElementById('infoModal');
        this.closeModal = document.querySelector('.close');
        this.victoryModal = document.getElementById('victoryModal');
        this.winnerInfo = document.getElementById('winnerInfo');
        this.playAgainBtn = document.getElementById('playAgainBtn');
    }
    
    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let value of this.values) {
                this.deck.push({
                    suit: suit,
                    value: value,
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            }
        }
        this.shuffleDeck();
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    drawCard() {
        if (this.deck.length === 0) {
            this.endGame('deck_empty');
            return null;
        }
        const card = this.deck.pop();
        this.cardsLeftElement.textContent = this.deck.length;
        return card;
    }
    
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = `card card-front ${card.color}`;
        cardElement.textContent = `${card.value}${card.suit}`;
        cardElement.addEventListener('click', () => this.playCard(card, cardElement));
        return cardElement;
    }
    
    getCardValue(card) {
        let value = 0;
        if (card.value === 'A') value = 11;
        else if (['J', 'Q', 'K'].includes(card.value)) value = 10;
        else value = parseInt(card.value);
        
        // Bonus por cartas rojas
        if (card.color === 'red') value += 2;
        
        return value;
    }
    
    dealInitialHands() {
        this.players.forEach(player => {
            player.hand = [];
            for (let i = 0; i < 5; i++) {
                const card = this.drawCard();
                if (card) {
                    player.hand.push(card);
                }
            }
        });
        this.renderCurrentPlayerHand();
    }
    
    renderCurrentPlayerHand() {
        this.playerHandElement.innerHTML = '';
        const currentPlayerHand = this.players[this.currentPlayer].hand;
        currentPlayerHand.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.playerHandElement.appendChild(cardElement);
        });
    }
    
    renderScoreboard() {
        this.playersScoresElement.innerHTML = '';
        
        // Ordenar jugadores por puntuación
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-score';
            
            if (player === this.players[this.currentPlayer] && !this.gameEnded) {
                playerElement.classList.add('active');
            }
            
            if (index === 0 && this.gameEnded) {
                playerElement.classList.add('winner');
            }
            
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';
            
            playerElement.innerHTML = `
                <div>${medal} ${player.name}</div>
                <div>${player.score} pts</div>
            `;
            
            this.playersScoresElement.appendChild(playerElement);
        });
        
        // Verificar condiciones de victoria después de actualizar el marcador
        if (!this.gameEnded) {
            this.checkWinConditions();
        }
    }
    
    playCard(card, cardElement) {
        if (this.gameEnded) return;
        
        const currentPlayerHand = this.players[this.currentPlayer].hand;
        const cardIndex = currentPlayerHand.findIndex(c => 
            c.suit === card.suit && c.value === card.value
        );
        
        if (cardIndex !== -1) {
            currentPlayerHand.splice(cardIndex, 1);
            this.playArea.push(card);
            
            // Mover carta al área de juego
            cardElement.remove();
            this.playAreaElement.appendChild(cardElement);
            
            // Actualizar puntuación
            const points = this.getCardValue(card);
            this.players[this.currentPlayer].score += points;
            
            // Renderizar mano actualizada
            this.renderCurrentPlayerHand();
            this.renderScoreboard();
            
            // Verificar condiciones de victoria
            this.checkWinConditions();
        }
    }
    
    drawNewCard() {
        if (this.gameEnded) return;
        
        const newCard = this.drawCard();
        if (newCard) {
            this.players[this.currentPlayer].hand.push(newCard);
            this.renderCurrentPlayerHand();
        }
    }
    
    nextTurn() {
        if (this.gameEnded) return;
        
        // Verificar condiciones de victoria antes de cambiar turno
        this.checkWinConditions();
        if (this.gameEnded) return;
        
        // Limpiar área de juego del turno anterior
        this.playAreaElement.innerHTML = '';
        
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.currentPlayerNameElement.textContent = this.players[this.currentPlayer].name;
        this.renderCurrentPlayerHand();
        this.renderScoreboard();
    }
    
    checkWinConditions() {
        // Condición 1: Alguien alcanza 100 puntos
        const highScorer = this.players.find(player => player.score >= 100);
        if (highScorer) {
            this.endGame('score_limit');
            return;
        }
        
        // Condición 2: Alguien se queda sin cartas
        const emptyHand = this.players.find(player => player.hand.length === 0);
        if (emptyHand) {
            this.endGame('empty_hand');
            return;
        }
    }
    
    endGame(reason) {
        this.gameEnded = true;
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];
        
        this.renderScoreboard();
        
        // Mostrar animación de victoria
        setTimeout(() => {
            this.showVictoryAnimation(winner, sortedPlayers, reason);
        }, 1000);
    }
    
    showVictoryAnimation(winner, sortedPlayers, reason) {
        // Determinar mensaje de victoria según la razón
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
            default:
                victoryMessage = '🎮 ¡Fin del juego!';
        }
        
        // Actualizar información del ganador
        this.winnerInfo.innerHTML = `
            <div>🏆 <strong>${winner.name}</strong> 🏆</div>
            <div style="font-size: 0.7em; margin-top: 5px; color: #fbbf24;">${victoryMessage}</div>
            <div style="font-size: 0.8em; margin-top: 10px;">${winner.score} puntos</div>
            <div style="font-size: 0.6em; margin-top: 15px; opacity: 0.9;">
                🥈 2°: ${sortedPlayers[1].name} (${sortedPlayers[1].score} pts)<br>
                🥉 3°: ${sortedPlayers[2].name} (${sortedPlayers[2].score} pts)<br>
                🏅 4°: ${sortedPlayers[3].name} (${sortedPlayers[3].score} pts)
            </div>
        `;
        
        // Mostrar modal con animación
        this.victoryModal.style.display = 'block';
        
        // Reproducir sonido de victoria (si el navegador lo permite)
        this.playVictorySound();
    }
    
    playVictorySound() {
        // Crear un sonido simple usando Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
        } catch (e) {
            // Si no se puede reproducir sonido, continuar sin él
        }
    }
    

    
    newGame() {
        this.players.forEach(player => {
            player.hand = [];
            player.score = 0;
        });
        this.currentPlayer = 0;
        this.playArea = [];
        this.gameEnded = false;
        
        this.playAreaElement.innerHTML = '';
        this.playerHandElement.innerHTML = '';
        this.currentPlayerNameElement.textContent = this.players[0].name;
        
        this.createDeck();
        this.dealInitialHands();
        this.renderScoreboard();
    }
    
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        
        this.drawCardBtn.addEventListener('click', () => {
            if (this.players[this.currentPlayer].hand.length < 7) {
                this.drawNewCard();
            } else {
                alert('¡Ya tienes demasiadas cartas en la mano!');
            }
        });
        
        this.endTurnBtn.addEventListener('click', () => this.nextTurn());
        
        this.infoBtn.addEventListener('click', () => {
            this.infoModal.style.display = 'block';
        });
        
        this.closeModal.addEventListener('click', () => {
            this.infoModal.style.display = 'none';
        });
        
        this.playAgainBtn.addEventListener('click', () => {
            this.victoryModal.style.display = 'none';
            this.newGame();
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === this.infoModal) {
                this.infoModal.style.display = 'none';
            }
        });
    }
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    const game = new CardGame();
    game.newGame();
});