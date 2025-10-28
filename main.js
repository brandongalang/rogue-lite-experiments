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

function create() {
    map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 50, height: 38 });
    const tileset = map.addTilesetImage('Overworld');
    const layer = map.createBlankLayer('layer1', tileset, 0, 0, 50, 38);

    // Create a simple grassy area
    layer.fill(3, 0, 0, 50, 38);

    // Add dungeon entrances in a 3x3 grid
    const dungeonTiles = [10, 11, 12, 20, 21, 22, 30, 31, 32];
    let tileIndex = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            map.putTileAt(dungeonTiles[tileIndex % dungeonTiles.length], 10 + i * 10, 10 + j * 10, layer);
            tileIndex++;
        }
    }

    player = this.physics.add.sprite(400, 300, 'character');
    this.physics.add.collider(player, layer);
    map.setCollisionBetween(10, 32, true);

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(player);

    keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    this.woodland_fantasy = this.sound.add('woodland_fantasy', { loop: true });
    this.woodland_fantasy.play();
}

function update() {
    const gates = map.getTilesWithinWorldXY(player.x - 16, player.y - 16, 32, 32);
    gates.forEach(gate => {
        if (gate.collides) {
            const gateBounds = new Phaser.Geom.Rectangle(gate.pixelX, gate.pixelY, 16, 16);
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), gateBounds) && keys.SPACE.isDown) {
                // Hide the main game
                game.canvas.style.display = 'none';
                // Show and start the roguelite game
                document.getElementById('roguelite-container').style.display = 'block';
                startGame(getSeed());
            }
        }
    });

    player.setVelocity(0);

    if (keys.A.isDown) {
        player.setVelocityX(-160);
    } else if (keys.D.isDown) {
        player.setVelocityX(160);
    }

    if (keys.W.isDown) {
        player.setVelocityY(-160);
    } else if (keys.S.isDown) {
        player.setVelocityY(160);
    }

    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        if (!this.footstepSound || !this.footstepSound.isPlaying) {
            this.footstepSound = this.sound.add('footstep');
            this.footstepSound.play();
        }
    }
}
