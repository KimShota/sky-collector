class Cloud {
  constructor() {
    // starts anywhere on x 
    this.x = random(width);
    // appear in the middle vertical position 
    this.y = random(height * 0.3, height * 0.7);
    // vary in size 
    this.size = random(60, 120);
    // set the speed to 5
    this.speed = 15; 
  }

  update() {
    // clouds move left 
    this.x -= this.speed;
    // when clouds pass to the left 
    if (this.x < -this.size) {
      // reset it to the right side 
      this.x = width + this.size;
      this.y = random(height * 0.3, height * 0.7);
    }
  }

  draw() {
    push();
    // moves the origin to the cloud 
    translate(this.x, this.y);
    scale(getScale());
    fill(255, 255, 255, 200);
    noStroke();
    
    // big ellipse in center 
    ellipse(0, 0, this.size, this.size * 0.6);
    // smaller one in left 
    ellipse(-this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    // smaller one in right
    ellipse(this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    ellipse(0, -this.size * 0.2, this.size * 0.6, this.size * 0.4);
    
    pop();
  }
}

