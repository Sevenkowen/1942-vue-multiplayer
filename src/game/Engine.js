import { Input } from './Input.js';
import { Player, Enemy, BigEnemy, Bullet, PowerUp, Explosion } from './Entities.js';
import { checkCollision } from './Collision.js';

const waterImage = new Image();
waterImage.src = '/water3.png';
let isWaterLoaded = false;
waterImage.onload = () => isWaterLoaded = true;

export class GameEngine {
  constructor(canvas, config, emitEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emitEvent = emitEvent; // To talk back to Vue (score, game over)
    
    this.isHost = config?.isHost ?? true;
    this.socket = config?.socket ?? null;
    this.roomCode = config?.roomCode ?? null;
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.input = new Input();
    this.player = new Player(this.width, this.height);
    this.player2 = new Player(this.width, this.height);
    this.player2.x += 80; // Offset player 2
    this.player2Input = { keys: { left: false, right: false, up: false, down: false, shoot: false } };
    
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.explosions = [];
    
    this.lastTime = 0;
    this.animationId = null;
    this.isRunning = false;
    
    this.score = 0;
    this.lives = 2; // Initial lives
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 1000; // ms
    
    this.bgY = 0;
  }

  setConfig(config) {
    this.isHost = config.isHost ?? true;
    this.socket = config.socket ?? null;
    this.roomCode = config.roomCode ?? null;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    
    if (this.socket) {
      this.socket.off('playerInput');
      this.socket.off('gameState');

      if (this.isHost) {
        this.socket.on('playerInput', (data) => {
          this.player2Input.keys = data.keys;
        });
      } else {
        this.socket.on('gameState', (data) => {
          this.syncState(data.state);
        });
      }
    }

    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  reset() {
    this.player = new Player(this.width, this.height);
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 2;
    this.emitEvent('updateScore', this.score);
    this.emitEvent('updateLives', this.lives);
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.socket && !this.isHost) {
      // Client mode: only send input, do not calculate physics
      this.socket.emit('playerInput', { roomCode: this.roomCode, keys: this.input.keys });
      this.updateClient(deltaTime); // Only for background scroll and effects if needed
    } else {
      // Host mode / Single Player: calculate everything
      this.update(deltaTime);
      
      if (this.socket && this.isHost) {
        // Broadcast state
        this.socket.emit('gameState', { roomCode: this.roomCode, state: this.serializeState() });
      }
    }

    this.draw();

    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }

  updateClient(deltaTime) {
    this.bgY += 100 * (deltaTime / 1000);
    if (this.bgY > 10000) this.bgY -= 10000;
  }

  serializeState() {
    return {
      p1: { x: this.player.x, y: this.player.y, inv: this.player.invulnerableTimer },
      p2: { x: this.player2.x, y: this.player2.y, inv: this.player2.invulnerableTimer },
      bullets: this.bullets.map(b => ({ x: b.x, y: b.y, w: b.width, h: b.height, type: b.type })),
      enemies: this.enemies.map(e => ({ x: e.x, y: e.y, w: e.width, h: e.height, isBig: e instanceof BigEnemy, hp: e.hp })),
      powerups: this.powerups.map(p => ({ x: p.x, y: p.y })),
      explosions: this.explosions.map(e => ({ x: e.x, y: e.y, w: e.width, h: e.height, fx: e.frameX }))
    };
  }

  syncState(state) {
    this.player.x = state.p1.x;
    this.player.y = state.p1.y;
    this.player.invulnerableTimer = state.p1.inv;
    
    this.player2.x = state.p2.x;
    this.player2.y = state.p2.y;
    this.player2.invulnerableTimer = state.p2.inv;

    // Fast sync by directly assigning plain objects that draw() can use
    this.bullets = state.bullets;
    this.enemies = state.enemies.map(e => {
      // We need proper classes for drawing if draw() expects methods, 
      // but if we just rely on properties we could fake it. Let's recreate them cleanly.
      const en = e.isBig ? new BigEnemy(e.x, e.y) : new Enemy(e.x, e.y);
      en.x = e.x; en.y = e.y; en.width = e.w; en.height = e.h; en.hp = e.hp;
      return en;
    });
    this.powerups = state.powerups.map(p => {
      const pu = new PowerUp(p.x, p.y);
      return pu;
    });
    this.explosions = state.explosions.map(e => {
      const ex = new Explosion(e.x, e.y, e.w, e.h);
      ex.frameX = e.fx;
      return ex;
    });
  }

  update(deltaTime) {
    // Scroll background
    this.bgY += 100 * (deltaTime / 1000);
    // bgY reset is handled in draw logic using modulo against waterImage.height if needed.
    if (this.bgY > 10000) this.bgY -= 10000; // Just prevent it from growing to infinity

    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer > this.enemySpawnInterval) {
      this.enemySpawnTimer = 0;
      const x = Math.random() * (this.width - 60); // Ensure they fit
      if (Math.random() < 0.1) { // 10% chance for big enemy
        this.enemies.push(new BigEnemy(x, -60));
      } else {
        this.enemies.push(new Enemy(x, -30));
      }
    }

    // Update Player
    this.player.update(deltaTime, this.input, this.bullets);
    if (this.socket) {
      this.player2.update(deltaTime, this.player2Input, this.bullets);
    }

    // Update Bullets
    this.bullets.forEach(bullet => bullet.update(deltaTime));
    
    // Update Enemies
    this.enemies.forEach(enemy => enemy.update(deltaTime, this.player, this.bullets));

    // Update PowerUps
    this.powerups.forEach(powerup => powerup.update(deltaTime));

    // Update Explosions
    this.explosions.forEach(explosion => explosion.update(deltaTime));

    // Collision Detection: PowerUps
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      if (checkCollision(this.player, powerup)) {
        powerup.markedForDeletion = true;
        if (this.player.weaponLevel < 3) {
          this.player.weaponLevel++;
        }
        this.score += 50; // Bonus points
        this.emitEvent('updateScore', this.score);
      }
    }

    // Collision Detection: Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Enemy vs Enemy Repulsion
      for (let k = 0; k < i; k++) {
        const otherEnemy = this.enemies[k];
        if (checkCollision(enemy, otherEnemy)) {
          // Calculate center points
          const cx1 = enemy.x + enemy.width / 2;
          const cx2 = otherEnemy.x + otherEnemy.width / 2;
          
          // Apply a gentle push on the X axis
          if (cx1 > cx2) {
            enemy.x += 1;
            otherEnemy.x -= 1;
          } else {
            enemy.x -= 1;
            otherEnemy.x += 1;
          }
        }
      }

      // Player vs Enemy
      if (checkCollision(this.player, enemy) && this.player.invulnerableTimer <= 0) {
        this.lives--;
        this.emitEvent('updateLives', this.lives);
        
        if (this.lives < 0) {
          this.emitEvent('gameOver');
          this.stop();
          return; // End update loop if game over
        } else {
          // Give invulnerability and reset weapon
          this.player.invulnerableTimer = 2000;
          this.player.weaponLevel = 1;
        }
      }

      // Bullets vs Enemy
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (bullet.type === 'player' && checkCollision(bullet, enemy)) {
          bullet.markedForDeletion = true;
          
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.markedForDeletion = true;
            this.score += enemy.scoreValue || 10;
            this.emitEvent('updateScore', this.score);
            
            // Spawn explosion
            this.explosions.push(new Explosion(enemy.x, enemy.y, enemy.width, enemy.height));

            // Drop powerup
            if (enemy instanceof BigEnemy) {
               this.powerups.push(new PowerUp(enemy.x + enemy.width / 2 - 10, enemy.y + enemy.height / 2));
            }
          }
          break; // Bullet is destroyed, move to next enemy
        }
      }
    }

    // Collision Detection: Enemy Bullets vs Player
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (bullet.type === 'enemy' && checkCollision(bullet, this.player) && this.player.invulnerableTimer <= 0) {
        bullet.markedForDeletion = true;
        this.lives--;
        this.emitEvent('updateLives', this.lives);
        
        if (this.lives < 0) {
          this.emitEvent('gameOver');
          this.stop();
          return; // End update loop if game over
        } else {
          // Give invulnerability and reset weapon
          this.player.invulnerableTimer = 2000;
          this.player.weaponLevel = 1;
        }
      }
    }

    // Filter out deleted entities
    this.bullets = this.bullets.filter(b => !b.markedForDeletion);
    this.enemies = this.enemies.filter(e => !e.markedForDeletion);
    this.powerups = this.powerups.filter(p => !p.markedForDeletion);
    this.explosions = this.explosions.filter(e => !e.markedForDeletion);
  }

  draw() {
    // Clear canvas fallback
    this.ctx.fillStyle = '#006699';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw scrolling background pattern
    if (isWaterLoaded) {
      // Scale down the 512x512 image to 128x128 to repeat it more times
      const imgW = 128;
      const imgH = 128;
      if (imgW > 0 && imgH > 0) {
        const yOffset = this.bgY % imgH;
        for (let x = 0; x < this.width; x += imgW) {
          for (let y = yOffset - imgH; y < this.height; y += imgH) {
            this.ctx.drawImage(waterImage, x, y, imgW, imgH);
          }
        }
      }
    }

    // Draw entities
    this.explosions.forEach(explosion => {
      if (explosion.draw) explosion.draw(this.ctx);
    });
    this.powerups.forEach(powerup => {
      if (powerup.draw) powerup.draw(this.ctx);
    });
    this.enemies.forEach(enemy => {
      if (enemy.draw) enemy.draw(this.ctx);
    });
    this.bullets.forEach(bullet => {
      if (bullet.draw) {
        bullet.draw(this.ctx);
      } else {
        // Fallback for serialized bullet
        this.ctx.fillStyle = bullet.type === 'player' ? '#ff0' : '#f00';
        this.ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
      }
    });
    this.player.draw(this.ctx);
    if (this.socket) {
      this.ctx.save();
      // Draw P2 slightly tinted or just as is
      this.ctx.globalAlpha = 0.8;
      this.player2.draw(this.ctx);
      this.ctx.restore();
    }
  }
}
