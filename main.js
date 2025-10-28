const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('Overworld', 'assets/gfx/Overworld.png');
    this.load.image('Inner', 'assets/gfx/Inner.png');
    this.load.spritesheet('character', 'assets/character.png', { frameWidth: 16, frameHeight: 16 });
    this.load.audio('woodland_fantasy', 'assets/woodland_fantasy.mp3');
    this.load.audio('footstep', 'assets/sfx100v2_footstep_01.ogg');
}

let player;
let map;
let keys;

let characterIndex = 0;
const characterFrames = [0, 4, 8, 12];

function create() {
    map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 50, height: 38 });
    const tileset = map.addTilesetImage('Overworld');
    const layer = map.createBlankLayer('layer1', tileset, 0, 0, 50, 38);

    // Create a simple grassy area
    layer.fill(3, 0, 0, 50, 38);

    // Add dungeon entrances in a 3x3 grid
    const dungeonTiles = [10, 5, 5, 5, 5, 5, 5, 5, 5];
    let tileIndex = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            map.putTileAt(dungeonTiles[tileIndex % dungeonTiles.length], 10 + i * 10, 10 + j * 10, layer);
            tileIndex++;
        }
    }

    player = this.physics.add.sprite(400, 300, 'character', characterFrames[characterIndex]);
    this.physics.add.collider(player, layer);
    map.setCollision([5, 10], true);

    this.add.text(168, 152, 'Dungeon 1', { font: '12px monospace', fill: '#ffffff' }).setOrigin(0.5);

    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(player);

    keys = this.input.keyboard.addKeys('W,A,S,D,LEFT,RIGHT');

    // Create animations for each character
    for (let i = 0; i < 4; i++) {
        this.anims.create({
            key: `walk_down_${i}`,
            frames: this.anims.generateFrameNumbers('character', { start: i * 4, end: i * 4 + 0 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: `walk_up_${i}`,
            frames: this.anims.generateFrameNumbers('character', { start: i * 4 + 1, end: i * 4 + 1 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: `walk_left_${i}`,
            frames: this.anims.generateFrameNumbers('character', { start: i * 4 + 2, end: i * 4 + 2 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: `walk_right_${i}`,
            frames: this.anims.generateFrameNumbers('character', { start: i * 4 + 3, end: i * 4 + 3 }),
            frameRate: 10,
            repeat: -1
        });
    }

    this.woodland_fantasy = this.sound.add('woodland_fantasy', { loop: true });
    this.woodland_fantasy.play();
}

function update() {
    const gate = map.getTileAtWorldXY(player.x, player.y);
    if (gate && gate.index === 10) {
        // Hide the main game
        game.canvas.style.display = 'none';
        // Show and start the roguelite game
        document.getElementById('roguelite-container').style.display = 'block';
        startGame(getSeed());
    }

    player.setVelocity(0);

    if (Phaser.Input.Keyboard.JustDown(keys.LEFT)) {
        characterIndex = (characterIndex - 1 + characterFrames.length) % characterFrames.length;
        player.setTexture('character', characterFrames[characterIndex]);
    } else if (Phaser.Input.Keyboard.JustDown(keys.RIGHT)) {
        characterIndex = (characterIndex + 1) % characterFrames.length;
        player.setTexture('character', characterFrames[characterIndex]);
    }

    if (keys.A.isDown) {
        player.setVelocityX(-160);
        player.anims.play(`walk_left_${characterIndex}`, true);
    } else if (keys.D.isDown) {
        player.setVelocityX(160);
        player.anims.play(`walk_right_${characterIndex}`, true);
    } else if (keys.W.isDown) {
        player.setVelocityY(-160);
        player.anims.play(`walk_up_${characterIndex}`, true);
    } else if (keys.S.isDown) {
        player.setVelocityY(160);
        player.anims.play(`walk_down_${characterIndex}`, true);
    } else {
        player.anims.stop();
    }

    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        if (!this.footstepSound || !this.footstepSound.isPlaying) {
            this.footstepSound = this.sound.add('footstep');
            this.footstepSound.play();
        }
    }
}
