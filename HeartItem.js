class HeartItem {
  constructor() {
    // appear just outside the screen
    this.x = width + 20;
    // random vertical position 
    this.y = random(50, height - 50);
    this.size = 25;
    // set the speed to 5
    this.speed = 5;
    this.pulse = 0;
  }

  // multiply its speed by 2 if the button is pressed and the player has a boost energy
  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
    // increase pulse continuously 
    this.pulse += 0.1;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    let pulseSize = this.size + sin(this.pulse) * 3;

    fill(255, 100, 150);
    stroke(255, 0, 100);
    strokeWeight(2 / getScale());
    // use beginShape and endShape to use vertex 
    beginShape();
    vertex(0, pulseSize * 0.3);
    // left arc of the heart 
    bezierVertex(-pulseSize * 0.5, -pulseSize * 0.3, -pulseSize * 0.8, 0, 0, pulseSize * 0.8);
    // right arc of the heart
    bezierVertex(pulseSize * 0.8, 0, pulseSize * 0.5, -pulseSize * 0.3, 0, pulseSize * 0.3);
    endShape(CLOSE);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

