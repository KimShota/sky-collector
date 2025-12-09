// ------------------------------
// Cloud Class
// ------------------------------
class Cloud {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.3, height * 0.7);
    this.size = random(60, 120);
    this.speed = random(5, 5);
  }

  update() {
    this.x -= this.speed;
    if (this.x < -this.size) {
      this.x = width + this.size;
      this.y = random(height * 0.3, height * 0.7);
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    fill(255, 255, 255, 200);
    noStroke();
    
    // Soft cloud shape
    ellipse(0, 0, this.size, this.size * 0.6);
    ellipse(-this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    ellipse(this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    ellipse(0, -this.size * 0.2, this.size * 0.6, this.size * 0.4);
    
    pop();
  }
}

