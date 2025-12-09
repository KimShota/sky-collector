// ------------------------------
// Bomb Class
// ------------------------------
class Bomb {
  constructor() {
    this.x = width + 20;
    this.y = random(50, height - 50);
    this.size = 30;
    this.speed = 5;
  }

  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());

    fill(40, 40, 40);
    stroke(0);
    strokeWeight(2 / getScale());
    circle(0, 0, this.size);

    fill(255, 0, 0);
    noStroke();
    circle(0, 0, this.size * 0.6);

    stroke(100, 50, 0);
    strokeWeight(3 / getScale());
    line(0, -this.size / 2, 5, -this.size / 2 - 10);

    fill(255, 200, 0);
    noStroke();
    circle(5, -this.size / 2 - 10, 5);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

