// ------------------------------
// Star Class
// ------------------------------
class Star {
  constructor() {
    this.x = width + 20;
    this.y = random(50, height - 50);
    this.size = 25;
    this.speed = 5;
    this.rotation = 0;
  }

  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
    this.rotation += 0.05;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    rotate(this.rotation);
    fill(255, 255, 0);
    stroke(255, 200, 0);
    strokeWeight(2 / getScale());

    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI / 5 * i - HALF_PI;
      vertex(cos(angle) * this.size, sin(angle) * this.size);

      angle = TWO_PI / 5 * (i + 0.5) - HALF_PI;
      vertex(cos(angle) * this.size * 0.5, sin(angle) * this.size * 0.5);
    }
    endShape(CLOSE);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

