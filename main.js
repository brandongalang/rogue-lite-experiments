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
    this.load.image('tiles', 'assets/tileset.png');
    this.load.spritesheet('Soldier-Blue', 'assets/Soldier-Blue.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Warrior-Red', 'assets/Warrior-Red.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Mage-Cyan', 'assets/Mage-Cyan.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('dungeon_ambience', 'assets/dungeon_ambience.ogg');
    this.load.audio('footstep', 'assets/sfx100v2_footstep_01.ogg');
}

let player;
let map;

function changeCharacter(key) {
    player.setTexture(key);
}

function create() {
    map = this.make.tilemap({ tileWidth: 16, tileHeight: 16 });
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16);
    const layer = map.createBlankLayer('layer1', tileset, 0, 0, 50, 38);

    // Create a simple room
    layer.fill(2, 0, 0, 50, 38); // Fill with floor
    layer.fill(1, 0, 0, 50, 1); // Top wall
    layer.fill(1, 0, 37, 50, 1); // Bottom wall
    layer.fill(1, 0, 0, 1, 38); // Left wall
    layer.fill(1, 49, 0, 1, 38); // Right wall

    // Add gates
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            map.putTileAt(3, 10 + i * 10, 10 + j * 10, layer);
        }
    }

    player = this.physics.add.sprite(400, 300, 'Soldier-Blue');
    this.physics.add.collider(player, layer);
    map.setCollision(1, true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.comingSoonText = this.add.text(250, 250, 'Coming Soon!', { fontSize: '32px', fill: '#fff' });
    this.comingSoonText.setVisible(false);

    this.dungeon_ambience = this.sound.add('dungeon_ambience', { loop: true });
    this.dungeon_ambience.play();
}

function update() {
    // Hide the "Coming Soon!" text by default
    this.comingSoonText.setVisible(false);

    // Check for overlap with any of the gates
    const gates = map.getTilesWithin(0, 0, 50, 38, { isColliding: false, hasInterestingFace: false });
    gates.forEach(gate => {
        if (gate.index === 3) {
            const gateBounds = new Phaser.Geom.Rectangle(gate.pixelX, gate.pixelY, 16, 16);
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), gateBounds) && this.cursors.space.isDown) {
                this.comingSoonText.setVisible(true);
            }
        }
    });

    player.setVelocity(0);

    if (this.cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
        player.setVelocityX(160);
    }

    if (this.cursors.up.isDown) {
        player.setVelocityY(-160);
    } else if (this.cursors.down.isDown) {
        player.setVelocityY(160);
    }

    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        if (!this.footstepSound || !this.footstepSound.isPlaying) {
            this.footstepSound = this.sound.add('footstep');
            this.footstepSound.play();
        }
    }
}
