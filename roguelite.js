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

// --- Sound Effects ---
let soundEffects = {
    buttonClick: null,
    damage: null,
    heal: null,
    treasure: null,
    dungeonAmbience: null
};

function initSounds() {
    if (window.gameScene) {
        soundEffects.buttonClick = window.gameScene.sound.add('footstep', { volume: 0.3 });
        soundEffects.dungeonAmbience = window.gameScene.sound.add('dungeon_ambience', { loop: true, volume: 0.4 });
        soundEffects.dungeonAmbience.play();
    }
}

function playSound(soundType) {
    if (!window.gameScene) return;

    const scene = window.gameScene;
    switch(soundType) {
        case 'click':
            scene.sound.play('footstep', { volume: 0.3 });
            break;
        case 'damage':
            scene.sound.play('footstep', { volume: 0.5, rate: 0.8 });
            break;
        case 'heal':
            scene.sound.play('footstep', { volume: 0.4, rate: 1.5 });
            break;
        case 'treasure':
            scene.sound.play('footstep', { volume: 0.4, rate: 1.2 });
            break;
    }
}

// --- Core Game Logic ---

let rng;
let gameState;
let actionsDisabled = false;

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

    initSounds();
    renderGame();
}

function fight() {
    if (actionsDisabled) return;
    actionsDisabled = true;
    playSound('click');

    disableButtons();

    setTimeout(() => {
        const hpLoss = rng.nextInt(1, 3);
        gameState.hp -= hpLoss;
        gameState.power += 1;
        gameState.log.push({ room: gameState.room, choice: 'Fight', hpLoss, powerGain: 1 });

        showScreenEffect('damage');
        showFloatingText(`-${hpLoss} HP`, 'damage');
        setTimeout(() => {
            showFloatingText('+1 Power', 'power');
        }, 300);
        playSound('damage');

        setTimeout(() => {
            actionsDisabled = false;
            nextRoom();
        }, 1200);
    }, 200);
}

function rest() {
    if (actionsDisabled) return;
    actionsDisabled = true;
    playSound('click');

    disableButtons();

    setTimeout(() => {
        const hpGain = Math.min(2, gameState.maxHp - gameState.hp);
        gameState.hp = Math.min(gameState.maxHp, gameState.hp + 2);
        gameState.log.push({ room: gameState.room, choice: 'Rest', hpGain: 2 });

        showScreenEffect('heal');
        showFloatingText(`+${hpGain} HP`, 'heal');
        playSound('heal');

        setTimeout(() => {
            actionsDisabled = false;
            nextRoom();
        }, 1200);
    }, 200);
}

function treasure() {
    if (actionsDisabled) return;
    actionsDisabled = true;
    playSound('click');

    disableButtons();

    setTimeout(() => {
        if (rng.next() > 0.5) {
            gameState.power += 2;
            gameState.log.push({ room: gameState.room, choice: 'Treasure', outcome: 'Success', powerGain: 2 });
            showFloatingText('+2 Power!', 'power');
            playSound('treasure');
        } else {
            const hpLoss = 2;
            gameState.hp -= hpLoss;
            gameState.log.push({ room: gameState.room, choice: 'Treasure', outcome: 'Failure', hpLoss });
            showScreenEffect('damage');
            showFloatingText(`-${hpLoss} HP`, 'damage');
            playSound('damage');
        }

        setTimeout(() => {
            actionsDisabled = false;
            nextRoom();
        }, 1200);
    }, 200);
}

function nextRoom() {
    if (gameState.hp <= 0) {
        setTimeout(() => {
            showGameOver('You Died');
        }, 500);
        return;
    }

    gameState.room += 1;

    if (gameState.room > 10) {
        setTimeout(() => {
            handleBoss();
        }, 500);
    } else {
        fadeOutAndRender();
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
    playSound('click');

    if (soundEffects.dungeonAmbience) {
        soundEffects.dungeonAmbience.stop();
    }

    const container = document.getElementById('roguelite-container');
    container.classList.remove('active');

    setTimeout(() => {
        container.style.display = 'none';
        game.canvas.style.display = 'block';

        if (window.gameScene && window.gameScene.woodland_fantasy) {
            window.gameScene.woodland_fantasy.setVolume(0.6);
            window.gameScene.woodland_fantasy.play();
        }

        canEnterDungeon = true;
    }, 300);
}

// --- Visual Effects ---

function showScreenEffect(type) {
    const overlay = document.createElement('div');
    overlay.className = `screen-overlay ${type}`;
    document.body.appendChild(overlay);

    setTimeout(() => overlay.style.opacity = '1', 10);

    setTimeout(() => {
        overlay.remove();
    }, 300);

    if (type === 'damage') {
        const container = document.getElementById('roguelite-container');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    }
}

function showFloatingText(text, type) {
    const floater = document.createElement('div');
    floater.className = `float-text ${type}`;
    floater.textContent = text;
    floater.style.left = '50%';
    floater.style.top = '40%';
    floater.style.transform = 'translateX(-50%)';
    document.body.appendChild(floater);

    setTimeout(() => {
        floater.remove();
    }, 1000);
}

function disableButtons() {
    const buttons = document.querySelectorAll('.actions button');
    buttons.forEach(btn => btn.disabled = true);
}

function fadeOutAndRender() {
    const container = document.getElementById('roguelite-container');
    container.style.opacity = '0';

    setTimeout(() => {
        renderGame();
        container.style.opacity = '1';
    }, 300);
}

// --- UI Rendering ---

function renderGame() {
    const container = document.getElementById('roguelite-container');

    const hpPercentage = (gameState.hp / gameState.maxHp) * 100;
    let hpBarClass = 'low';
    if (hpPercentage > 66) hpBarClass = 'high';
    else if (hpPercentage > 33) hpBarClass = 'medium';

    const roomProgress = Math.floor((gameState.room / 10) * 100);

    container.innerHTML = `
        <div class="dungeon-panel">
            <h2>Room ${gameState.room}/10</h2>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-label">Health</div>
                    <div class="hp-bar-container">
                        <div class="hp-bar ${hpBarClass}" style="width: ${hpPercentage}%"></div>
                    </div>
                    <div class="stat-value">${gameState.hp}/${gameState.maxHp}</div>
                </div>

                <div class="stat-box">
                    <div class="stat-label">Power</div>
                    <div class="stat-value">⚔️ ${gameState.power}</div>
                </div>
            </div>

            ${gameState.room === 10 ? `
                <div class="stat-box" style="background: rgba(139, 0, 0, 0.3); border-color: #ff6b6b; margin: 15px auto; width: fit-content;">
                    <div class="stat-label">Boss Power Required</div>
                    <div class="stat-value" style="color: #ff6b6b;">⚔️ ${gameState.bossPower}</div>
                </div>
            ` : ''}

            <div class="actions">
                <button onclick="fight()" title="Press 1">⚔️ Fight</button>
                <button onclick="rest()" title="Press 2">❤️ Rest</button>
                <button onclick="treasure()" title="Press 3">💰 Treasure</button>
            </div>

            <div class="info-text">
                <strong>⚔️ Fight:</strong> Lose 1-3 HP, gain 1 power<br>
                <strong>❤️ Rest:</strong> Gain 2 HP (up to max)<br>
                <strong>💰 Treasure:</strong> 50% gain 2 power, 50% lose 2 HP<br>
                <br>
                <em>Reach room 10 with enough power to defeat the boss!</em>
            </div>
        </div>
    `;

    setupKeyboardShortcuts();
}

function showGameOver(message) {
    const container = document.getElementById('roguelite-container');

    const isWin = message.includes('Win');
    const isDeath = message.includes('Died');
    const messageColor = isWin ? '#44ff44' : isDeath ? '#ff4444' : '#ffaa44';
    const messageEmoji = isWin ? '🎉' : isDeath ? '💀' : '❌';

    container.innerHTML = `
        <div class="dungeon-panel game-over">
            <h2 style="color: ${messageColor}; font-size: 48px;">
                ${messageEmoji} ${message} ${messageEmoji}
            </h2>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-label">Your Power</div>
                    <div class="stat-value" style="color: ${isWin ? '#44ff44' : '#ff4444'};">⚔️ ${gameState.power}</div>
                </div>

                <div class="stat-box">
                    <div class="stat-label">Boss Power</div>
                    <div class="stat-value">⚔️ ${gameState.bossPower}</div>
                </div>
            </div>

            <div class="info-text">
                <strong>Rooms Cleared:</strong> ${gameState.room - 1}/10<br>
                <strong>Final HP:</strong> ${gameState.hp}/${gameState.maxHp}<br>
            </div>

            <button onclick="restartGame()">Return to Overworld</button>
        </div>
    `;
}

// --- Keyboard Shortcuts ---

function setupKeyboardShortcuts() {
    document.onkeydown = (e) => {
        if (actionsDisabled) return;

        switch(e.key) {
            case '1':
                fight();
                break;
            case '2':
                rest();
                break;
            case '3':
                treasure();
                break;
            case 'Escape':
                restartGame();
                break;
        }
    };
}
