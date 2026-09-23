import {
  VECTOR_BREAK_LEVELS,
  VECTOR_LANDER_MISSIONS,
  burnLanderFuel,
  circleRectBounceAxis,
  circleRectHit,
  createVectorBreakBricks,
  isVectorBreakLevelClear,
  isSafeLanderTouchdown,
  nextMenuGridIndex,
  nextSnakeHead,
  rectsOverlap,
  terrainHeightAtX,
  wrapPoint,
} from './game-core.mjs?v=20260923-6';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const titleEl = document.querySelector('#game-title');
const scoreEl = document.querySelector('#score');
const livesEl = document.querySelector('#lives');
const instructionsEl = document.querySelector('#instructions');
const hudEl = document.querySelector('.hud');
const gameMenu = document.querySelector('#game-menu');
const gameMenuButton = document.querySelector('#game-menu-button');
const gameButtons = [...document.querySelectorAll('[data-game-id]')];
const touchActionButton = document.querySelector('[data-control="action"]');

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

function setHud(title, score, lives, instructions, actionLabel = 'ACTION') {
  titleEl.textContent = title;
  scoreEl.textContent = String(Math.max(0, Math.floor(score))).padStart(6, '0');
  livesEl.textContent = String(Math.max(0, lives)).padStart(2, '0');
  instructionsEl.textContent = instructions;
  touchActionButton.textContent = actionLabel;
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

class VectorBreak {
  constructor() {
    this.title = 'VECTOR BREAK';
    this.actionLabel = 'SERVE';
    this.instructions = 'MOVE: ← → / A D   START: ENTER OR SPACE   M / ESC: MENU';
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.levelIndex = 0;
    this.paddle = { x: 330, y: 438, w: 140, h: 10 };
    this.trail = [];
    this.loadLevel();
  }

  start() {
    if (this.state === 'over' || this.state === 'won') {
      Object.assign(this, new VectorBreak());
    } else if (this.state === 'level-cleared') {
      this.levelIndex += 1;
      this.loadLevel();
    }
    this.state = 'playing';
  }

  loadLevel() {
    this.currentLevel = VECTOR_BREAK_LEVELS[this.levelIndex];
    this.bricks = createVectorBreakBricks(this.currentLevel);
    this.paddle.x = 330;
    this.resetBall();
  }

  resetBall() {
    const speedMultiplier = 1 + this.levelIndex * 0.07;
    this.ball = {
      x: this.paddle.x + this.paddle.w / 2,
      y: 408,
      r: 6,
      vx: 190 * speedMultiplier * (Math.random() > 0.5 ? 1 : -1),
      vy: -225 * speedMultiplier,
    };
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
    const previousBallPosition = { x: this.ball.x, y: this.ball.y };
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
        if (!brick.indestructible) {
          brick.hits -= 1;
          brick.alive = brick.hits > 0;
          this.score += brick.maxHits > 1 ? 175 : 125;
        }
        const bounceAxis = circleRectBounceAxis(this.ball, brick, previousBallPosition);
        this.ball[bounceAxis === 'x' ? 'vx' : 'vy'] *= -1;
        const speed = Math.hypot(this.ball.vx, this.ball.vy);
        const nextSpeed = Math.min(430, speed * 1.006);
        this.ball.vx = (this.ball.vx / speed) * nextSpeed;
        this.ball.vy = (this.ball.vy / speed) * nextSpeed;
        break;
      }
    }

    if (isVectorBreakLevelClear(this.bricks)) {
      this.state = this.levelIndex === VECTOR_BREAK_LEVELS.length - 1 ? 'won' : 'level-cleared';
      return;
    }
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
      ctx.strokeStyle = brick.indestructible
        ? COLORS.bright
        : brick.hits < brick.maxHits ? COLORS.dim : COLORS.phosphor;
      ctx.lineWidth = brick.indestructible ? 2.5 : 1.5;
      ctx.shadowColor = COLORS.phosphor;
      ctx.shadowBlur = brick.indestructible ? 10 : 6;
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
      ctx.beginPath();
      if (brick.indestructible) {
        ctx.moveTo(brick.x + 7, brick.y + 5);
        ctx.lineTo(brick.x + brick.w - 7, brick.y + brick.h - 5);
        ctx.moveTo(brick.x + brick.w - 7, brick.y + 5);
        ctx.lineTo(brick.x + 7, brick.y + brick.h - 5);
      } else if (brick.maxHits > 1) {
        ctx.moveTo(brick.x + brick.w / 2, brick.y + 4);
        ctx.lineTo(brick.x + brick.w / 2, brick.y + brick.h - 4);
      } else {
        ctx.moveTo(brick.x + 8, brick.y + brick.h / 2);
        ctx.lineTo(brick.x + brick.w - 8, brick.y + brick.h / 2);
      }
      ctx.strokeStyle = brick.indestructible ? COLORS.dim : COLORS.faint;
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

    vectorText(
      `LEVEL ${String(this.levelIndex + 1).padStart(2, '0')} / ${String(VECTOR_BREAK_LEVELS.length).padStart(2, '0')}  ${this.currentLevel.name}`,
      22,
      28,
      18,
      'left',
      COLORS.dim,
    );
    if (this.state === 'ready') overlay(`LEVEL ${String(this.levelIndex + 1).padStart(2, '0')}`, `${this.currentLevel.name} // ENTER / SPACE TO SERVE`);
    if (this.state === 'level-cleared') overlay('LEVEL CLEARED', `ENTER / SPACE FOR LEVEL ${String(this.levelIndex + 2).padStart(2, '0')}`);
    if (this.state === 'over') overlay('SIGNAL LOST', 'ENTER / SPACE TO REBOOT');
    if (this.state === 'won') overlay('ALL SECTORS CLEARED', 'ENTER / SPACE FOR ANOTHER RUN');
  }
}

class VectorSnake {
  constructor() {
    this.title = 'VECTOR SNAKE';
    this.actionLabel = 'START';
    this.instructions = 'STEER: ARROWS / WASD   START: ENTER OR SPACE   M / ESC: MENU';
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

class VectorLander {
  constructor() {
    this.title = 'VECTOR LANDER';
    this.actionLabel = 'START';
    this.unlimitedFuel = false;
    this.updateInstructions();
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.mission = 1;
    this.landingBonus = 0;
    this.loadMission();
  }

  updateInstructions() {
    const fuelMode = this.unlimitedFuel ? 'UNLIMITED' : 'LIMITED';
    this.instructions = `ROTATE: ← → / A D   THRUST: ↑ / W   F: FUEL ${fuelMode}   M / ESC: MENU`;
  }

  toggleUnlimitedFuel() {
    this.unlimitedFuel = !this.unlimitedFuel;
    this.updateInstructions();
  }

  loadMission() {
    const missionIndex = (this.mission - 1) % VECTOR_LANDER_MISSIONS.length;
    const cycle = Math.floor((this.mission - 1) / VECTOR_LANDER_MISSIONS.length);
    this.currentMission = VECTOR_LANDER_MISSIONS[missionIndex];
    this.gravity = this.currentMission.gravity + cycle * 3;
    this.resetShip();
  }

  resetShip() {
    const { start } = this.currentMission;
    this.ship = { x: start.x, y: start.y, vx: start.vx, vy: 0, angle: 0, r: 13 };
    this.fuel = 100;
    this.thrusting = false;
    this.state = 'ready';
  }

  start() {
    if (this.state === 'over') {
      const { unlimitedFuel } = this;
      Object.assign(this, new VectorLander());
      this.unlimitedFuel = unlimitedFuel;
      this.updateInstructions();
    } else if (this.state === 'landed') {
      this.mission += 1;
      this.loadMission();
    } else if (this.state === 'crashed') {
      this.resetShip();
    }
    this.state = 'playing';
  }

  update(dt) {
    this.thrusting = false;
    if (this.state !== 'playing') return;

    const turn = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
      - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    this.ship.angle = Math.max(-1.35, Math.min(1.35, this.ship.angle + turn * 2.25 * dt));

    if ((keys.has('ArrowUp') || keys.has('KeyW')) && (this.unlimitedFuel || this.fuel > 0)) {
      const thrust = 105;
      this.ship.vx += Math.sin(this.ship.angle) * thrust * dt;
      this.ship.vy -= Math.cos(this.ship.angle) * thrust * dt;
      this.fuel = burnLanderFuel(this.fuel, 14 * dt, this.unlimitedFuel);
      this.thrusting = true;
    }

    this.ship.vy += this.gravity * dt;
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;

    if (this.ship.x < 18 || this.ship.x > WIDTH - 18) {
      this.ship.x = Math.max(18, Math.min(WIDTH - 18, this.ship.x));
      this.ship.vx *= -0.35;
    }
    if (this.ship.y < 24) {
      this.ship.y = 24;
      this.ship.vy = Math.max(0, this.ship.vy);
    }

    const groundY = terrainHeightAtX(this.currentMission.terrain, this.ship.x);
    if (this.ship.y + this.ship.r < groundY) return;

    const landedSafely = isSafeLanderTouchdown(this.ship, this.currentMission.pad);
    this.ship.y = groundY - this.ship.r;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.thrusting = false;
    if (landedSafely) {
      this.ship.angle = 0;
      this.landingBonus = this.mission * 500 + Math.round(this.fuel) * 10;
      this.score += this.landingBonus;
      this.state = 'landed';
      return;
    }

    this.lives -= 1;
    this.state = this.lives <= 0 ? 'over' : 'crashed';
  }

  drawShip() {
    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.angle);
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 10);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.moveTo(6, 8);
    ctx.lineTo(11, 14);
    ctx.moveTo(-6, 8);
    ctx.lineTo(-11, 14);
    ctx.stroke();
    if (this.thrusting) {
      ctx.strokeStyle = COLORS.dim;
      ctx.beginPath();
      ctx.moveTo(-5, 10);
      ctx.lineTo(0, 22 + Math.random() * 7);
      ctx.lineTo(5, 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    clearScreen();
    const { terrain, pad, name } = this.currentMission;
    ctx.save();
    ctx.strokeStyle = COLORS.dim;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    terrain.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pad.x, pad.y);
    ctx.lineTo(pad.x + pad.w, pad.y);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (const x of [pad.x, pad.x + pad.w]) {
      ctx.beginPath();
      ctx.moveTo(x, pad.y - 8);
      ctx.lineTo(x, pad.y + 8);
      ctx.stroke();
    }
    ctx.restore();

    this.drawShip();
    vectorText(`MISSION ${String(this.mission).padStart(2, '0')}  ${name}`, 22, 24, 18, 'left', COLORS.dim);
    const fuelLabel = this.unlimitedFuel
      ? 'FUEL INF'
      : `FUEL ${Math.ceil(this.fuel).toString().padStart(3, '0')}`;
    vectorText(fuelLabel, WIDTH - 22, 24, 18, 'right', this.unlimitedFuel || this.fuel < 20 ? COLORS.bright : COLORS.dim);
    vectorText(
      `H/S ${Math.abs(this.ship.vx).toFixed(0).padStart(3, '0')}  V/S ${Math.max(0, this.ship.vy).toFixed(0).padStart(3, '0')}  ANG ${Math.round(Math.abs(this.ship.angle) * 180 / Math.PI).toString().padStart(2, '0')}°`,
      22,
      48,
      16,
      'left',
      COLORS.dim,
    );
    if (this.state === 'ready') overlay('VECTOR LANDER', `${name} // ENTER / SPACE TO DESCEND`);
    if (this.state === 'crashed') overlay('HULL BREACH', 'ENTER / SPACE TO RETRY');
    if (this.state === 'landed') overlay('TOUCHDOWN', `BONUS ${this.landingBonus} // ENTER / SPACE FOR NEXT MISSION`);
    if (this.state === 'over') overlay('MISSION FAILED', 'ENTER / SPACE TO REBOOT');
  }
}

class VectorAsteroids {
  constructor() {
    this.title = 'VECTOR ASTEROIDS';
    this.actionLabel = 'FIRE';
    this.instructions = 'TURN: ← → / A D   THRUST: ↑ / W   FIRE: ENTER / SPACE   M / ESC: MENU';
    this.score = 0;
    this.lives = 3;
    this.state = 'ready';
    this.wave = 1;
    this.ship = { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, angle: -Math.PI / 2, r: 12 };
    this.shots = [];
    this.rocks = [];
    this.sparks = [];
    this.cooldown = 0;
    this.invulnerable = 2;
    this.stars = Array.from({ length: 55 }, (_, index) => ({
      x: (index * 149 + 37) % WIDTH,
      y: (index * 83 + 19) % HEIGHT,
      bright: index % 5 === 0,
    }));
    this.spawnWave();
  }

  createRock(x, y, size = 3, inheritedVelocity) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 24 + Math.random() * 38 + this.wave * 3;
    const radius = size === 3 ? 38 : size === 2 ? 24 : 13;
    const velocity = inheritedVelocity || { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
    return {
      x, y, size, r: radius,
      vx: velocity.vx,
      vy: velocity.vy,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 1.4,
      shape: Array.from({ length: 10 }, () => 0.68 + Math.random() * 0.34),
      dead: false,
    };
  }

  spawnWave() {
    const count = Math.min(8, 3 + this.wave);
    for (let index = 0; index < count; index += 1) {
      const edge = index % 4;
      const x = edge === 0 ? 45 : edge === 1 ? WIDTH - 45 : 60 + Math.random() * (WIDTH - 120);
      const y = edge === 2 ? 45 : edge === 3 ? HEIGHT - 45 : 50 + Math.random() * (HEIGHT - 100);
      this.rocks.push(this.createRock(x, y, 3));
    }
  }

  start() {
    if (this.state === 'over') Object.assign(this, new VectorAsteroids());
    this.state = 'playing';
  }

  action() {
    if (this.state !== 'playing') {
      this.start();
      return;
    }
    if (this.cooldown > 0 || this.shots.length >= 6) return;
    const noseX = Math.cos(this.ship.angle);
    const noseY = Math.sin(this.ship.angle);
    this.shots.push({
      x: this.ship.x + noseX * 17,
      y: this.ship.y + noseY * 17,
      vx: this.ship.vx + noseX * 420,
      vy: this.ship.vy + noseY * 420,
      ttl: 1.15,
    });
    this.cooldown = 0.16;
  }

  explode(x, y, count = 9) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 90;
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ttl: 0.35 + Math.random() * 0.45 });
    }
  }

  splitRock(rock) {
    rock.dead = true;
    this.score += rock.size === 3 ? 100 : rock.size === 2 ? 200 : 400;
    this.explode(rock.x, rock.y, 5 + rock.size * 3);
    if (rock.size <= 1) return;
    for (const direction of [-1, 1]) {
      const speed = Math.hypot(rock.vx, rock.vy) * 1.25 + 18;
      const angle = Math.atan2(rock.vy, rock.vx) + direction * (0.55 + Math.random() * 0.3);
      this.rocks.push(this.createRock(rock.x, rock.y, rock.size - 1, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }));
    }
  }

  resetShip() {
    this.ship = { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, angle: -Math.PI / 2, r: 12 };
    this.invulnerable = 2.5;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.state !== 'playing') return;

    const turn = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
      - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    this.ship.angle += turn * 3.5 * dt;
    const thrusting = keys.has('ArrowUp') || keys.has('KeyW');
    if (thrusting) {
      this.ship.vx += Math.cos(this.ship.angle) * 175 * dt;
      this.ship.vy += Math.sin(this.ship.angle) * 175 * dt;
    }
    if (keys.has('ArrowDown') || keys.has('KeyS')) {
      this.ship.vx *= Math.pow(0.08, dt);
      this.ship.vy *= Math.pow(0.08, dt);
    }
    const speed = Math.hypot(this.ship.vx, this.ship.vy);
    if (speed > 280) {
      this.ship.vx = (this.ship.vx / speed) * 280;
      this.ship.vy = (this.ship.vy / speed) * 280;
    }
    this.ship.vx *= Math.pow(0.985, dt * 60);
    this.ship.vy *= Math.pow(0.985, dt * 60);
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;
    Object.assign(this.ship, wrapPoint(this.ship, WIDTH, HEIGHT, 16));

    for (const shot of this.shots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.ttl -= dt;
      Object.assign(shot, wrapPoint(shot, WIDTH, HEIGHT, 2));
    }
    for (const rock of this.rocks) {
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      rock.angle += rock.spin * dt;
      Object.assign(rock, wrapPoint(rock, WIDTH, HEIGHT, rock.r));
    }
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.ttl -= dt;
    }

    for (const shot of this.shots) {
      if (shot.dead) continue;
      const rock = this.rocks.find((candidate) => !candidate.dead && Math.hypot(candidate.x - shot.x, candidate.y - shot.y) < candidate.r + 3);
      if (rock) {
        shot.dead = true;
        this.splitRock(rock);
      }
    }

    if (this.invulnerable <= 0) {
      const collision = this.rocks.find((rock) => !rock.dead && Math.hypot(rock.x - this.ship.x, rock.y - this.ship.y) < rock.r + this.ship.r);
      if (collision) {
        this.explode(this.ship.x, this.ship.y, 18);
        collision.dead = true;
        this.lives -= 1;
        if (this.lives <= 0) this.state = 'over';
        else this.resetShip();
      }
    }

    this.shots = this.shots.filter((shot) => !shot.dead && shot.ttl > 0);
    this.rocks = this.rocks.filter((rock) => !rock.dead);
    this.sparks = this.sparks.filter((spark) => spark.ttl > 0);
    if (this.state === 'playing' && this.rocks.length === 0) {
      this.wave += 1;
      this.invulnerable = Math.max(this.invulnerable, 1.2);
      this.spawnWave();
    }
  }

  drawRock(rock) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.angle);
    ctx.strokeStyle = rock.size === 3 ? COLORS.dim : COLORS.phosphor;
    ctx.lineWidth = rock.size === 1 ? 1.5 : 2;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = rock.size === 1 ? 8 : 4;
    ctx.beginPath();
    rock.shape.forEach((scale, index) => {
      const angle = (index / rock.shape.length) * Math.PI * 2;
      const x = Math.cos(angle) * rock.r * scale;
      const y = Math.sin(angle) * rock.r * scale;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawShip() {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2) return;
    const thrusting = keys.has('ArrowUp') || keys.has('KeyW');
    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.angle + Math.PI / 2);
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.phosphor;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(11, 13); ctx.lineTo(0, 8); ctx.lineTo(-11, 13); ctx.closePath();
    ctx.stroke();
    if (thrusting) {
      ctx.strokeStyle = COLORS.dim;
      ctx.beginPath();
      ctx.moveTo(-5, 11); ctx.lineTo(0, 24 + Math.random() * 5); ctx.lineTo(5, 11); ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    clearScreen();
    this.stars.forEach((star) => {
      ctx.fillStyle = star.bright ? COLORS.dim : COLORS.faint;
      ctx.fillRect(star.x, star.y, 1, star.bright ? 2 : 1);
    });
    this.rocks.forEach((rock) => this.drawRock(rock));
    ctx.strokeStyle = COLORS.bright;
    ctx.lineWidth = 2;
    this.shots.forEach((shot) => {
      ctx.beginPath(); ctx.arc(shot.x, shot.y, 2.5, 0, Math.PI * 2); ctx.stroke();
    });
    this.sparks.forEach((spark) => {
      ctx.globalAlpha = Math.min(1, spark.ttl * 2);
      ctx.fillStyle = COLORS.phosphor;
      ctx.fillRect(spark.x, spark.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    this.drawShip();
    vectorText(`WAVE ${this.wave}`, 22, 24, 18, 'left', COLORS.dim);
    if (this.state === 'ready') overlay('VECTOR ASTEROIDS', 'ENTER / SPACE TO LAUNCH');
    if (this.state === 'over') overlay('SHIP LOST', 'ENTER / SPACE TO REBUILD');
  }
}

class VectorInvaders {
  constructor() {
    this.title = 'VECTOR INVADERS';
    this.actionLabel = 'FIRE';
    this.instructions = 'MOVE: ← → / A D   FIRE: ENTER / SPACE   M / ESC: MENU';
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

function createGame(id) {
  if (id === 'vector-break') return new VectorBreak();
  if (id === 'vector-invaders') return new VectorInvaders();
  if (id === 'vector-asteroids') return new VectorAsteroids();
  if (id === 'vector-snake') return new VectorSnake();
  if (id === 'vector-lander') return new VectorLander();
  return null;
}

function drawMenuBackdrop() {
  clearScreen();
  ctx.strokeStyle = COLORS.faint;
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
}

function showMenu() {
  keys.clear();
  currentGame = null;
  document.body.classList.add('menu-open');
  gameMenu.hidden = false;
  gameMenuButton.hidden = true;
  hudEl.hidden = true;
  titleEl.textContent = 'SELECT GAME';
  instructionsEl.textContent = 'SELECT: ARROWS / WASD   PLAY: ENTER OR SPACE';
  drawMenuBackdrop();
  const selectedButton = gameButtons.find((button) => button.getAttribute('aria-current') === 'true');
  (selectedButton || gameButtons[0]).focus({ preventScroll: true });
}

function loadGame(id) {
  const nextGame = createGame(id);
  if (!nextGame) return;
  currentGame = nextGame;
  document.body.classList.remove('menu-open');
  gameButtons.forEach((button) => {
    if (button.dataset.gameId === id) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  gameMenu.hidden = true;
  gameMenuButton.hidden = false;
  hudEl.hidden = false;
  setHud(currentGame.title, currentGame.score, currentGame.lives, currentGame.instructions, currentGame.actionLabel);
  canvas.focus({ preventScroll: true });
}

function action() {
  if (!currentGame) return;
  if (typeof currentGame.action === 'function') currentGame.action();
  else currentGame.start();
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  if (currentGame) {
    currentGame.update(dt);
    currentGame.draw();
    setHud(currentGame.title, currentGame.score, currentGame.lives, currentGame.instructions, currentGame.actionLabel);
  }
  requestAnimationFrame(frame);
}

function moveMenuFocus(direction) {
  const activeIndex = gameButtons.indexOf(document.activeElement);
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const nextIndex = nextMenuGridIndex(currentIndex, direction, gameButtons.length);
  gameButtons[nextIndex].focus({ preventScroll: true });
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape' || event.code === 'KeyM') {
    showMenu();
    return;
  }

  if (!gameMenu.hidden) {
    const menuDirections = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      KeyA: 'left',
      KeyD: 'right',
      KeyW: 'up',
      KeyS: 'down',
    };
    const menuDirection = menuDirections[event.code];
    if (menuDirection) {
      moveMenuFocus(menuDirection);
      return;
    }
    if ((event.code === 'Enter' || event.code === 'Space') && gameButtons.includes(document.activeElement)) {
      event.preventDefault();
      loadGame(document.activeElement.dataset.gameId);
    }
    return;
  }

  if (event.code === 'Enter' || event.code === 'Space') action();
  if (
    event.code === 'KeyF'
    && !event.repeat
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && typeof currentGame?.toggleUnlimitedFuel === 'function'
  ) {
    event.preventDefault();
    currentGame.toggleUnlimitedFuel();
    return;
  }
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
gameMenuButton.addEventListener('click', showMenu);
gameButtons.forEach((button) => button.addEventListener('click', () => loadGame(button.dataset.gameId)));

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

showMenu();
requestAnimationFrame(frame);
