// A simple seeded pseudo-random number generator (Mulberry32)
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

// Function to get seed from URL or generate a random one
function getSeed() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedFromUrl = urlParams.get('seed');
    if (seedFromUrl && !isNaN(seedFromUrl)) {
        return parseInt(seedFromUrl, 10);
    }
    return Math.floor(Math.random() * 1000000);
}

// --- Core Game Logic ---

let rng;
let gameState;

function startGame(seed) {
    rng = new SeededRandom(seed);
    const startHp = rng.nextInt(8, 12);
    gameState = {
        hp: startHp,
        maxHp: startHp,
        power: rng.nextInt(0, 2),
        room: 1,
        log: [],
        bossPower: rng.nextInt(8, 12)
    };
    renderGame();
}

function fight() {
    const hpLoss = rng.nextInt(1, 3);
    gameState.hp -= hpLoss;
    gameState.power += 1;
    gameState.log.push({ room: gameState.room, choice: 'Fight', hpLoss, powerGain: 1 });
    nextRoom();
}

function rest() {
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 2);
    gameState.log.push({ room: gameState.room, choice: 'Rest', hpGain: 2 });
    nextRoom();
}

function treasure() {
    if (rng.next() > 0.5) { // 50% chance of success
        gameState.power += 2;
        gameState.log.push({ room: gameState.room, choice: 'Treasure', outcome: 'Success', powerGain: 2 });
    } else {
        const hpLoss = 2;
        gameState.hp -= hpLoss;
        gameState.log.push({ room: gameState.room, choice: 'Treasure', outcome: 'Failure', hpLoss });
    }
    nextRoom();
}

function nextRoom() {
    if (gameState.hp <= 0) {
        showGameOver('You Died');
        return;
    }

    gameState.room += 1;

    if (gameState.room > 10) {
        handleBoss();
    } else {
        renderGame();
    }
}

function handleBoss() {
    if (gameState.power >= gameState.bossPower) {
        showGameOver('You Win!');
    } else {
        showGameOver('You Lose!');
    }
}

function restartGame() {
    document.getElementById('roguelite-container').style.display = 'none';
    game.canvas.style.display = 'block';
}


// --- UI Rendering ---

function renderGame() {
    const container = document.getElementById('roguelite-container');
    const hpMeter = '█'.repeat(Math.max(0, gameState.hp)) + '░'.repeat(Math.max(0, gameState.maxHp - gameState.hp));

    container.innerHTML = `
        <h2>Room ${gameState.room}/10</h2>
        <p>HP: ${hpMeter} ${gameState.hp}/${gameState.maxHp}</p>
        <p>Power: ${gameState.power}</p>
        <div class="actions">
            <button onclick="fight()">[Fight]</button>
            <button onclick="rest()">[Rest]</button>
            <button onclick="treasure()">[Treasure]</button>
        </div>
        <pre>
[Fight] - Lose 1-3 HP, gain 1 power
[Rest] - Gain 2 HP
[Treasure] - 50% gain 2 power, 50% lose 2 HP
        </pre>
    `;
}

function showGameOver(message) {
    const container = document.getElementById('roguelite-container');
    container.innerHTML = `
        <h2>${message}</h2>
        <p>Final Power: ${gameState.power}</p>
        <p>Boss Power Required: ${gameState.bossPower}</p>
        <button onclick="restartGame()">Play Again?</button>
    `;
}
