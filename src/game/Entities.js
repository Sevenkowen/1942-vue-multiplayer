const playerImage = new Image();
playerImage.src = '/player3.png';
let isPlayerImageLoaded = false;
playerImage.onload = () => isPlayerImageLoaded = true;

const enemyImage = new Image();
enemyImage.src = '/enemy.png';
let isEnemyImageLoaded = false;
enemyImage.onload = () => isEnemyImageLoaded = true;

const bigEnemyImage = new Image();
bigEnemyImage.src = '/big_enemy.png';
let isBigEnemyImageLoaded = false;
bigEnemyImage.onload = () => isBigEnemyImageLoaded = true;

const explosionImage = new Image();
explosionImage.src = '/explosion.png';
let isExplosionLoaded = false;
explosionImage.onload = () => isExplosionLoaded = true;

export class Entity {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.markedForDeletion = false;
  }

  update(deltaTime) {
    // Override in subclasses
  }

  draw(ctx) {
    // Override in subclasses
  }
}

export class Player extends Entity {
  constructor(gameWidth, gameHeight) {
    // 80x80 to make the plane a bit bigger
    super(gameWidth / 2 - 40, gameHeight - 100, 80, 80, 400);
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.shootTimer = 0;
    this.shootInterval = 150; // ms between shots
    this.weaponLevel = 1;
    this.invulnerableTimer = 0;
    this.propellerAngle = 0;
  }

  update(deltaTime, input, bullets) {
    // Movement
    if (input.keys.left) this.x -= this.speed * (deltaTime / 1000);
    if (input.keys.right) this.x += this.speed * (deltaTime / 1000);
    if (input.keys.up) this.y -= this.speed * (deltaTime / 1000);
    if (input.keys.down) this.y += this.speed * (deltaTime / 1000);

    // Boundaries
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.gameWidth) this.x = this.gameWidth - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > this.gameHeight) this.y = this.gameHeight - this.height;

    // Invulnerability
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    // Shooting
    if (this.shootTimer > 0) {
      this.shootTimer -= deltaTime;
    }
    
    if (input.keys.shoot && this.shootTimer <= 0) {
      this.shoot(bullets);
      this.shootTimer = this.shootInterval;
    }
  }

  shoot(bullets) {
    const bWidth = 4;
    const bHeight = 10;
    const speed = -500;
    
    if (this.weaponLevel === 1) {
      // Single shot
      bullets.push(new Bullet(this.x + this.width / 2 - bWidth / 2, this.y, bWidth, bHeight, 0, speed, 'player'));
    } else if (this.weaponLevel === 2) {
      // Double shot
      bullets.push(new Bullet(this.x + this.width / 4 - bWidth / 2, this.y, bWidth, bHeight, 0, speed, 'player'));
      bullets.push(new Bullet(this.x + (this.width / 4) * 3 - bWidth / 2, this.y, bWidth, bHeight, 0, speed, 'player'));
    } else {
      // Triple spread shot
      bullets.push(new Bullet(this.x + this.width / 2 - bWidth / 2, this.y, bWidth, bHeight, 0, speed, 'player'));
      bullets.push(new Bullet(this.x + this.width / 2 - bWidth / 2, this.y, bWidth, bHeight, -100, speed, 'player'));
      bullets.push(new Bullet(this.x + this.width / 2 - bWidth / 2, this.y, bWidth, bHeight, 100, speed, 'player'));
    }
  }

  draw(ctx) {
    if (this.invulnerableTimer > 0) {
      // Blink effect
      if (Math.floor(Date.now() / 100) % 2 === 0) return;
    }
    
    if (isPlayerImageLoaded) {
      ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#00f'; // Blue triangle for player fallback
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y); // Top center
      ctx.lineTo(this.x + this.width, this.y + this.height); // Bottom right
      ctx.lineTo(this.x, this.y + this.height); // Bottom left
      ctx.closePath();
      ctx.fill();
    }
  }
}

export class Bullet extends Entity {
  constructor(x, y, width, height, velocityX, velocityY, type) {
    super(x, y, width, height, 0);
    this.velocityX = velocityX;
    this.velocityY = velocityY; // Negative for player (up), positive for enemy (down)
    this.type = type; // 'player' or 'enemy'
  }

  update(deltaTime) {
    this.x += this.velocityX * (deltaTime / 1000);
    this.y += this.velocityY * (deltaTime / 1000);
    
    // Mark for deletion if off screen. We assume gameHeight is approx 1000, 
    // will be checked in the main loop more precisely, but rough bound here or in engine.
    if (this.y < -50 || this.y > 2000) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.type === 'player' ? '#ff0' : '#f00'; // Yellow for player, Red for enemy
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Enemy extends Entity {
  constructor(x, y) {
    super(x, y, 50, 50, Math.random() * 100 + 100); // Speed between 100 and 200
    this.hp = 1;
    this.age = 0;
    this.shootTimer = Math.random() * 2000 + 1000; // 1 to 3 seconds
  }

  update(deltaTime, player, bullets) {
    this.age += deltaTime;
    // Zigzag movement
    this.x += Math.sin(this.age / 500) * 50 * (deltaTime / 1000);
    this.y += this.speed * (deltaTime / 1000);
    
    // Shooting
    this.shootTimer -= deltaTime;
    if (this.shootTimer <= 0 && bullets) {
      this.shootTimer = Math.random() * 2000 + 1000; // Reset
      bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y + this.height, 4, 10, 0, 300, 'enemy'));
    }

    if (this.y > 2000) { // Off screen bottom
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    if (isEnemyImageLoaded) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(Math.PI); // Rotate 180 degrees so they face down
      ctx.drawImage(enemyImage, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f00'; // Red square for enemy fallback
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

export class BigEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.width = 100;
    this.height = 100;
    this.speed = Math.random() * 50 + 50; // Slower speed: 50 to 100
    this.hp = 5; // Needs more hits
    this.scoreValue = 50;
    this.shootTimer = 1000; // Shoot more frequently
  }

  update(deltaTime, player, bullets) {
    // Tracking movement
    if (player) {
      const dir = player.x > this.x ? 1 : -1;
      this.x += dir * 40 * (deltaTime / 1000); // Slowly move towards player X
    }
    this.y += this.speed * (deltaTime / 1000);
    
    // Shooting
    this.shootTimer -= deltaTime;
    if (this.shootTimer <= 0 && bullets) {
      this.shootTimer = 1500; // Reset
      // Double shot for big enemy
      bullets.push(new Bullet(this.x + this.width / 4 - 2, this.y + this.height, 4, 10, 0, 400, 'enemy'));
      bullets.push(new Bullet(this.x + (this.width / 4) * 3 - 2, this.y + this.height, 4, 10, 0, 400, 'enemy'));
    }

    if (this.y > 2000) { // Off screen bottom
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    if (isBigEnemyImageLoaded) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(Math.PI); // Rotate 180 degrees so they face down
      ctx.drawImage(bigEnemyImage, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#800080'; // Purple for big enemy
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // Draw HP bar
    ctx.fillStyle = '#0f0';
    ctx.fillRect(this.x, this.y - 10, this.width * (this.hp / 5), 5);
  }
}

export class PowerUp extends Entity {
  constructor(x, y) {
    super(x, y, 20, 20, 100); // Falls slowly
  }

  update(deltaTime) {
    this.y += this.speed * (deltaTime / 1000);
    if (this.y > 2000) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0ff'; // Cyan square for powerup
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('P', this.x + 5, this.y + 15);
  }
}

export class Explosion extends Entity {
  constructor(x, y, width, height) {
    super(x, y, width, height, 0);
    this.frameX = 0;
    this.maxFrames = 12; // estimated frames
    this.frameTimer = 0;
    this.frameInterval = 1000 / 20; // 20 frames per second
  }

  update(deltaTime) {
    this.frameTimer += deltaTime;
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      this.frameX++;
      if (this.frameX >= this.maxFrames) {
        this.markedForDeletion = true;
      }
    }
  }

  draw(ctx) {
    if (isExplosionLoaded) {
      const frameW = 1024 / this.maxFrames;
      const frameH = 85;
      ctx.drawImage(explosionImage, this.frameX * frameW, 0, frameW, frameH, this.x, this.y, this.width, this.height);
    }
  }
}
