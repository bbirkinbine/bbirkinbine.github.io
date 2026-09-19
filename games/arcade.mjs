import { chooseGame, circleRectHit, nextSnakeHead, rectsOverlap } from './game-core.mjs';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const titleEl = document.querySelector('#game-title');
const scoreEl = document.querySelector('#score');
const livesEl = document.querySelector('#lives');
const instructionsEl = document.querySelector('#instructions');
const newGameButton = document.querySelector('#new-game');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const COLORS = {
  background: '#031007',
  phosphor: '#66ff88',
  bright: '#c5ffd1',
  dim: '#258f45',
  faint: '#174d29',
};

const keys = new Set();
let currentGame;
let lastTime = performance.now();

function setHud(title, score, lives, instructions) {
  titleEl.textContent = title;
  scoreEl.textContent = String(Math.max(0, Math.floor(score))).padStart(6, '0');
  livesEl.textContent = String(Math.max(0, lives)).padStart(2, '0');
  instructionsEl.textContent = instructions;
}

function clearScreen() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = 'rgba(102, 255, 136, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 20; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 20; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function vectorText(text, x, y, size = 24, align = 'center', color = COLORS.bright) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "VT323", "IBM Plex Mono", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = COLORS.phosphor;
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function overlay(title, subtitle) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 5, 3, 0.78)';
  ctx.fillRect(120, 170, 560, 140);
  ctx.strokeStyle = COLORS.phosphor;
  ctx.lineWidth = 2;
  ctx.strokeRect(120, 170, 560, 140);
  vectorText(title, WIDTH / 2, 215, 42);
  vectorText(subtitle, WIDTH / 2, 267, 20, 'center', COLORS.dim);
  ctx.restore();
}

function lineShip(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = COLORS.bright;
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.phosphor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(11, 12);
  ctx.lineTo(0, 7);
  ctx.lineTo(-11, 12);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, 11);
  ctx.lineTo(0, 19 + Math.random() * 5);
  ctx.lineTo(5, 11);
  ctx.strokeStyle = COLORS.dim;
  ctx.stroke();
  ctx.restore();
}

class VectorBreak {
  constructor() {
    this.title = 'VECTOR BREAK';
    this.instructions = 'MOVE: ← → / A D   START: ENTER OR SPACE   R: RANDOM GAME';
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.paddle = { x: 330, y: 438, w: 140, h: 10 };
    this.ball = { x: 400, y: 408, r: 6, vx: 190, vy: -225 };
    this.trail = [];
    this.bricks = [];
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        this.bricks.push({ x: 44 + column * 90, y: 62 + row * 38, w: 72, h: 20, alive: true });
      }
    }
  }

  start() {
    if (this.state === 'over' || this.state === 'won') Object.assign(this, new VectorBreak());
    this.state = 'playing';
  }

  resetBall() {
    this.ball = { x: this.paddle.x + this.paddle.w / 2, y: 408, r: 6, vx: 190 * (Math.random() > 0.5 ? 1 : -1), vy: -225 };
    this.trail = [];
    this.state = 'ready';
  }

  update(dt) {
    const direction = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
      - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    this.paddle.x = Math.max(18, Math.min(WIDTH - 18 - this.paddle.w, this.paddle.x + direction * 370 * dt));
    if (this.state !== 'playing') {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      return;
    }

    this.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.trail.length > 8) this.trail.shift();
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.x - this.ball.r < 12 || this.ball.x + this.ball.r > WIDTH - 12) {
      this.ball.vx *= -1;
      this.ball.x = Math.max(12 + this.ball.r, Math.min(WIDTH - 12 - this.ball.r, this.ball.x));
    }
    if (this.ball.y - this.ball.r < 12) {
      this.ball.vy = Math.abs(this.ball.vy);
      this.ball.y = 12 + this.ball.r;
    }

    if (this.ball.vy > 0 && circleRectHit(this.ball, this.paddle)) {
      const offset = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      this.ball.vx = offset * 300;
      this.ball.vy = -Math.max(220, Math.abs(this.ball.vy));
      this.ball.y = this.paddle.y - this.ball.r - 1;
    }

    for (const brick of this.bricks) {
      if (brick.alive && circleRectHit(this.ball, brick)) {
        brick.alive = false;
        this.score += 125;
        this.ball.vy *= -1;
        break;
      }
    }

    if (this.bricks.every((brick) => !brick.alive)) this.state = 'won';
    if (this.ball.y - this.ball.r > HEIGHT) {
      this.lives -= 1;
      if (this.lives <= 0) this.state = 'over';
      else this.resetBall();
    }
  }

  draw() {
    clearScreen();
    ctx.strokeStyle = COLORS.dim;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      ctx.strokeStyle = COLORS.phosphor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = COLORS.phosphor;
      ctx.shadowBlur = 6;
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
      ctx.beginPath();
      ctx.moveTo(brick.x + 8, brick.y + brick.h / 2);
      ctx.lineTo(brick.x + brick.w - 8, brick.y + brick.h / 2);
      ctx.strokeStyle = COLORS.faint;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    this.trail.forEach((point, index) => {
      ctx.fillStyle = `rgba(102, 255, 136, ${0.05 + index * 0.05})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 + index * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (this.state === 'ready') overlay('VECTOR BREAK', 'ENTER / SPACE TO SERVE');
    if (this.state === 'over') overlay('SIGNAL LOST', 'ENTER / SPACE TO REBOOT');
    if (this.state === 'won') overlay('SECTOR CLEARED', 'ENTER / SPACE FOR ANOTHER RUN');
  }
}

class StarDodge {
  constructor() {
    this.title = 'STAR DODGE';
    this.instructions = 'PILOT: ARROWS / WASD   START: ENTER OR SPACE   SURVIVE 45 SECONDS';
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.ship = { x: 400, y: 410, r: 12 };
    this.rocks = [];
    this.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, speed: 16 + Math.random() * 44 }));
    this.spawnTimer = 0;
    this.elapsed = 0;
    this.invulnerable = 0;
  }

  start() {
    if (this.state === 'over' || this.state === 'won') Object.assign(this, new StarDodge());
    this.state = 'playing';
  }

  update(dt) {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > HEIGHT) {
        star.y = 0;
        star.x = Math.random() * WIDTH;
      }
    }
    if (this.state !== 'playing') return;

    const dx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    const dy = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
    this.ship.x = Math.max(24, Math.min(WIDTH - 24, this.ship.x + dx * 280 * dt));
    this.ship.y = Math.max(40, Math.min(HEIGHT - 30, this.ship.y + dy * 280 * dt));

    this.elapsed += dt;
    this.score = this.elapsed * 100;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const radius = 9 + Math.random() * 18;
      this.rocks.push({ x: 30 + Math.random() * (WIDTH - 60), y: -30, r: radius, speed: 115 + Math.random() * 145, spin: Math.random() * Math.PI, turn: (Math.random() - 0.5) * 2 });
      this.spawnTimer = Math.max(0.16, 0.55 - this.elapsed * 0.006);
    }

    for (const rock of this.rocks) {
      rock.y += rock.speed * dt;
      rock.spin += rock.turn * dt;
      const distance = Math.hypot(rock.x - this.ship.x, rock.y - this.ship.y);
      if (this.invulnerable <= 0 && distance < rock.r + this.ship.r) {
        this.lives -= 1;
        this.invulnerable = 1.5;
        rock.y = HEIGHT + 100;
        if (this.lives <= 0) this.state = 'over';
      }
    }
    this.rocks = this.rocks.filter((rock) => rock.y < HEIGHT + 60);
    if (this.elapsed >= 45) this.state = 'won';
  }

  drawRock(rock) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.spin);
    ctx.strokeStyle = COLORS.phosphor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const radius = rock.r * (index % 2 ? 0.72 : 1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    clearScreen();
    for (const star of this.stars) {
      ctx.fillStyle = star.speed > 40 ? COLORS.phosphor : COLORS.dim;
      ctx.fillRect(star.x, star.y, 1, star.speed > 40 ? 4 : 2);
    }
    this.rocks.forEach((rock) => this.drawRock(rock));
    if (this.invulnerable <= 0 || Math.floor(this.invulnerable * 10) % 2 === 0) lineShip(this.ship.x, this.ship.y);
    vectorText(`TIME ${Math.max(0, 45 - this.elapsed).toFixed(1)}`, 22, 28, 18, 'left', COLORS.dim);
    if (this.state === 'ready') overlay('STAR DODGE', 'ENTER / SPACE TO LAUNCH');
    if (this.state === 'over') overlay('SHIP DESTROYED', 'ENTER / SPACE TO REBUILD');
    if (this.state === 'won') overlay('JUMP POINT REACHED', 'ENTER / SPACE FOR ANOTHER RUN');
  }
}

class VectorSnake {
  constructor() {
    this.title = 'VECTOR SNAKE';
    this.instructions = 'STEER: ARROWS / WASD   START: ENTER OR SPACE   R: RANDOM GAME';
    this.score = 0;
    this.lives = 1;
    this.state = 'ready';
    this.columns = 25;
    this.rows = 15;
    this.cell = 32;
    this.snake = [{ x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }];
    this.direction = { x: 1, y: 0 };
    this.pendingDirection = { x: 1, y: 0 };
    this.food = this.placeFood();
    this.stepTimer = 0;
  }

  start() {
    if (this.state === 'over') Object.assign(this, new VectorSnake());
    this.state = 'playing';
  }

  placeFood() {
    let food;
    do {
      food = { x: Math.floor(Math.random() * this.columns), y: Math.floor(Math.random() * this.rows) };
    } while (this.snake?.some((segment) => segment.x === food.x && segment.y === food.y));
    return food;
  }

  setDirection(x, y) {
    if (x !== -this.direction.x || y !== -this.direction.y) this.pendingDirection = { x, y };
  }

  update(dt) {
    if (keys.has('ArrowLeft') || keys.has('KeyA')) this.setDirection(-1, 0);
    if (keys.has('ArrowRight') || keys.has('KeyD')) this.setDirection(1, 0);
    if (keys.has('ArrowUp') || keys.has('KeyW')) this.setDirection(0, -1);
    if (keys.has('ArrowDown') || keys.has('KeyS')) this.setDirection(0, 1);
    if (this.state !== 'playing') return;

    this.stepTimer += dt;
    const step = Math.max(0.065, 0.13 - this.score * 0.00012);
    if (this.stepTimer < step) return;
    this.stepTimer = 0;
    this.direction = this.pendingDirection;
    const head = nextSnakeHead(this.snake[0], this.direction, this.columns, this.rows);
    if (this.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.state = 'over';
      this.lives = 0;
      return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 100;
      this.food = this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  drawCell(cell, inset = 5, color = COLORS.phosphor) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cell.x * this.cell + inset, cell.y * this.cell + inset, this.cell - inset * 2, this.cell - inset * 2);
  }

  draw() {
    clearScreen();
    ctx.strokeStyle = COLORS.faint;
    ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2);
    this.snake.forEach((segment, index) => this.drawCell(segment, index === 0 ? 3 : 6, index === 0 ? COLORS.bright : COLORS.phosphor));
    ctx.save();
    ctx.translate(this.food.x * this.cell + this.cell / 2, this.food.y * this.cell + this.cell / 2);
    ctx.rotate(performance.now() / 500);
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 13);
    ctx.stroke();
    ctx.restore();
    if (this.state === 'ready') overlay('VECTOR SNAKE', 'ENTER / SPACE TO INITIALIZE');
    if (this.state === 'over') overlay('TAIL COLLISION', 'ENTER / SPACE TO REBOOT');
  }
}

class VectorInvaders {
  constructor() {
    this.title = 'VECTOR INVADERS';
    this.instructions = 'MOVE: ← → / A D   FIRE: ENTER OR SPACE   R: RANDOM GAME';
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.player = { x: 380, y: 438, w: 40, h: 18 };
    this.invaders = [];
    this.bullets = [];
    this.bombs = [];
    this.bunkers = [];
    this.direction = 1;
    this.fireCooldown = 0;
    this.bombTimer = 0.8;
    this.phase = 0;
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 10; column += 1) {
        this.invaders.push({ x: 105 + column * 60, y: 58 + row * 38, w: 32, h: 22, row, column, alive: true });
      }
    }
    for (const center of [155, 320, 485, 650]) {
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          if (row === 1 && column === 2) continue;
          this.bunkers.push({ x: center - 35 + column * 14, y: 365 + row * 12, w: 13, h: 11, alive: true });
        }
      }
    }
  }

  start() {
    if (this.state === 'over' || this.state === 'won') Object.assign(this, new VectorInvaders());
    this.state = 'playing';
  }

  action() {
    if (this.state !== 'playing') {
      this.start();
      return;
    }
    if (this.fireCooldown <= 0 && this.bullets.length < 2) {
      this.bullets.push({ x: this.player.x + this.player.w / 2 - 2, y: this.player.y - 12, w: 4, h: 14 });
      this.fireCooldown = 0.22;
    }
  }

  lowestInvaders() {
    const byColumn = new Map();
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      const current = byColumn.get(invader.column);
      if (!current || invader.y > current.y) byColumn.set(invader.column, invader);
    }
    return [...byColumn.values()];
  }

  hitBunker(projectile) {
    const cell = this.bunkers.find((part) => part.alive && rectsOverlap(projectile, part));
    if (!cell) return false;
    cell.alive = false;
    return true;
  }

  update(dt) {
    const move = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
      - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    this.player.x = Math.max(18, Math.min(WIDTH - 18 - this.player.w, this.player.x + move * 300 * dt));
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.phase += dt * 6;
    if (this.state !== 'playing') return;

    const living = this.invaders.filter((invader) => invader.alive);
    const speed = 24 + (50 - living.length) * 1.35;
    let drop = false;
    if (living.length) {
      const left = Math.min(...living.map((invader) => invader.x));
      const right = Math.max(...living.map((invader) => invader.x + invader.w));
      drop = (this.direction < 0 && left + this.direction * speed * dt < 18)
        || (this.direction > 0 && right + this.direction * speed * dt > WIDTH - 18);
    }
    if (drop) {
      this.direction *= -1;
      living.forEach((invader) => { invader.y += 17; });
    } else {
      living.forEach((invader) => { invader.x += this.direction * speed * dt; });
    }

    this.bullets.forEach((bullet) => { bullet.y -= 390 * dt; });
    this.bombs.forEach((bomb) => { bomb.y += 205 * dt; });

    for (const bullet of this.bullets) {
      if (bullet.dead || this.hitBunker(bullet)) {
        bullet.dead = true;
        continue;
      }
      const target = this.invaders.find((invader) => invader.alive && rectsOverlap(bullet, invader));
      if (target) {
        target.alive = false;
        bullet.dead = true;
        this.score += (5 - target.row) * 50;
      }
    }

    for (const bomb of this.bombs) {
      if (bomb.dead || this.hitBunker(bomb)) {
        bomb.dead = true;
        continue;
      }
      if (rectsOverlap(bomb, this.player)) {
        bomb.dead = true;
        this.lives -= 1;
        if (this.lives <= 0) this.state = 'over';
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead && bullet.y + bullet.h > 0);
    this.bombs = this.bombs.filter((bomb) => !bomb.dead && bomb.y < HEIGHT);
    this.bombTimer -= dt;
    if (this.bombTimer <= 0 && living.length) {
      const shooters = this.lowestInvaders();
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      this.bombs.push({ x: shooter.x + shooter.w / 2 - 2, y: shooter.y + shooter.h, w: 4, h: 13 });
      this.bombTimer = Math.max(0.28, 1.05 - (50 - living.length) * 0.012);
    }

    if (living.some((invader) => invader.y + invader.h >= this.player.y - 8)) this.state = 'over';
    if (this.invaders.every((invader) => !invader.alive)) this.state = 'won';
  }

  drawInvader(invader) {
    const pulse = Math.floor(this.phase) % 2;
    ctx.save();
    ctx.translate(invader.x + invader.w / 2, invader.y + invader.h / 2);
    ctx.strokeStyle = invader.row === 0 ? COLORS.bright : COLORS.phosphor;
    ctx.lineWidth = invader.row < 2 ? 2 : 1.5;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    if (invader.row === 0) {
      ctx.moveTo(0, -11); ctx.lineTo(15, 0); ctx.lineTo(7, 10); ctx.lineTo(-7, 10); ctx.lineTo(-15, 0); ctx.closePath();
      ctx.moveTo(-6, 1); ctx.lineTo(6, 1);
    } else if (invader.row < 3) {
      ctx.moveTo(-15, 7); ctx.lineTo(-10, -7); ctx.lineTo(0, -11); ctx.lineTo(10, -7); ctx.lineTo(15, 7);
      ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.moveTo(-6, 8); ctx.lineTo(-10 - pulse * 3, 12); ctx.moveTo(6, 8); ctx.lineTo(10 + pulse * 3, 12);
    } else {
      ctx.moveTo(-15, 2); ctx.lineTo(-8, -9); ctx.lineTo(8, -9); ctx.lineTo(15, 2); ctx.lineTo(8, 10); ctx.lineTo(-8, 10); ctx.closePath();
      ctx.moveTo(-5, -2); ctx.lineTo(-2, 2); ctx.moveTo(5, -2); ctx.lineTo(2, 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer() {
    ctx.save();
    ctx.translate(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-20, 8); ctx.lineTo(-13, -2); ctx.lineTo(-5, -2); ctx.lineTo(0, -10);
    ctx.lineTo(5, -2); ctx.lineTo(13, -2); ctx.lineTo(20, 8); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    clearScreen();
    ctx.strokeStyle = COLORS.dim;
    ctx.beginPath();
    ctx.moveTo(12, 460);
    ctx.lineTo(WIDTH - 12, 460);
    ctx.stroke();
    this.invaders.filter((invader) => invader.alive).forEach((invader) => this.drawInvader(invader));
    this.bunkers.filter((part) => part.alive).forEach((part) => {
      ctx.strokeStyle = COLORS.dim;
      ctx.strokeRect(part.x, part.y, part.w, part.h);
    });
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2;
    [...this.bullets, ...this.bombs].forEach((shot) => {
      ctx.beginPath();
      ctx.moveTo(shot.x + shot.w / 2, shot.y);
      ctx.lineTo(shot.x + shot.w / 2, shot.y + shot.h);
      ctx.stroke();
    });
    this.drawPlayer();
    vectorText(`HOSTILES ${this.invaders.filter((invader) => invader.alive).length}`, 22, 24, 18, 'left', COLORS.dim);
    if (this.state === 'ready') overlay('VECTOR INVADERS', 'ENTER / SPACE TO DEFEND');
    if (this.state === 'over') overlay('SECTOR OVERRUN', 'ENTER / SPACE TO REDEPLOY');
    if (this.state === 'won') overlay('FORMATION DESTROYED', 'ENTER / SPACE FOR ANOTHER WAVE');
  }
}

function createGame(id = chooseGame()) {
  if (id === 'vector-break') return new VectorBreak();
  if (id === 'star-dodge') return new StarDodge();
  if (id === 'vector-invaders') return new VectorInvaders();
  return new VectorSnake();
}

function loadRandomGame() {
  currentGame = createGame();
  setHud(currentGame.title, currentGame.score, currentGame.lives, currentGame.instructions);
  canvas.focus({ preventScroll: true });
}

function action() {
  if (typeof currentGame.action === 'function') currentGame.action();
  else currentGame.start();
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  currentGame.update(dt);
  currentGame.draw();
  setHud(currentGame.title, currentGame.score, currentGame.lives, currentGame.instructions);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    window.location.assign('/');
    return;
  }
  if (event.code === 'KeyR') {
    loadRandomGame();
    return;
  }
  if (event.code === 'Enter' || event.code === 'Space') action();
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
newGameButton.addEventListener('click', loadRandomGame);

for (const button of document.querySelectorAll('[data-control]')) {
  const mapping = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  const control = button.dataset.control;
  if (control === 'action') {
    button.addEventListener('click', action);
    continue;
  }
  const code = mapping[control];
  const down = (event) => {
    event.preventDefault();
    keys.add(code);
  };
  const up = (event) => {
    event.preventDefault();
    keys.delete(code);
  };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
  button.addEventListener('pointerleave', up);
}

loadRandomGame();
requestAnimationFrame(frame);
